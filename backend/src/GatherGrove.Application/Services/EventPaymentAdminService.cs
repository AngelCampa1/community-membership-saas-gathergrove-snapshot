using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using System.Text;

namespace GatherGrove.Application.Services
{
    public class EventPaymentAdminService : IEventPaymentAdminService
    {
        private readonly GatherGroveDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<EventPaymentAdminService> _logger;
        private readonly StripeSettings _stripeSettings;

        public EventPaymentAdminService(
            GatherGroveDbContext context,
            IEmailService emailService,
            ILogger<EventPaymentAdminService> logger,
            IOptions<StripeSettings> stripeSettings)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            _stripeSettings = stripeSettings.Value;
        }

        public async Task<EventPaymentOverviewResponse> GetEventPaymentOverviewAsync(int clubId, int eventId)
        {
            // Verify event exists and belongs to club
            var eventEntity = await _context.Events
                .Include(e => e.Club)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

            if (eventEntity == null)
            {
                throw new ArgumentException($"Event {eventId} not found");
            }

            // Get all RSVPs for the event
            // Note: We project directly to DTOs below to avoid N+1 queries,
            // since MemberId is non-nullable but guest registrations use MemberId=0
            var rsvps = await _context.EventRsvps
                .Where(r => r.EventId == eventId)
                .ToListAsync();

            // Batch-load members for non-guest RSVPs to avoid N+1 queries
            var memberIds = rsvps
                .Where(r => !r.IsGuestRegistration && r.MemberId > 0)
                .Select(r => r.MemberId)
                .Distinct()
                .ToList();
            var members = memberIds.Count > 0
                ? await _context.Members
                    .Where(m => memberIds.Contains(m.Id))
                    .ToDictionaryAsync(m => m.Id)
                : new Dictionary<int, Member>();

            _logger.LogInformation("Found {Count} RSVPs for event {EventId}", rsvps.Count, eventId);

            // Calculate payment statistics
            var paymentSummary = new PaymentSummaryStats
            {
                Completed = rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded),
                Pending = rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Pending),
                Failed = rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Failed),
                Refunded = rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Refunded),
                ManualPayments = rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded && string.IsNullOrEmpty(r.StripePaymentIntentId))
            };

            // Calculate total revenue (excluding refunded payments)
            var totalRevenue = rsvps
                .Where(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded && r.PaidAmount.HasValue)
                .Sum(r => r.PaidAmount!.Value);

            // Build attendee list using the batch-loaded members dictionary
            var attendees = rsvps.Select(r =>
            {
                var member = !r.IsGuestRegistration && r.MemberId > 0 && members.TryGetValue(r.MemberId, out var m) ? m : null;
                return new EventAttendeePaymentInfo
                {
                    RsvpId = r.Id,
                    MemberId = r.IsGuestRegistration ? null : r.MemberId,
                    Name = r.IsGuestRegistration ? r.GuestName ?? "Guest" : member?.FullName ?? "Unknown",
                    Email = r.IsGuestRegistration ? r.GuestEmail ?? "" : member?.Email ?? "",
                    MemberStatus = r.IsGuestRegistration ? "guest" : "member",
                    PaymentStatus = r.PaymentStatus.ToString().ToLower(),
                    AmountPaid = r.PaidAmount,
                    PaymentDate = r.UpdatedAt,
                    PaymentMethod = string.IsNullOrEmpty(r.StripePaymentIntentId) ? "cash" : "stripe",
                    CanRefund = !string.IsNullOrEmpty(r.StripePaymentIntentId) && r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded,
                    StripePaymentIntentId = r.StripePaymentIntentId
                };
            }).ToList();

            return new EventPaymentOverviewResponse
            {
                EventId = eventEntity.Id,
                EventName = eventEntity.Name,
                TotalRevenue = totalRevenue,
                TotalAttendees = rsvps.Count,
                PaymentSummary = paymentSummary,
                Attendees = attendees
            };
        }

        public async Task<EventRefundResponse> IssueRefundAsync(int clubId, IssueRefundRequest request)
        {
            try
            {
                // Verify event exists and belongs to club
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == request.EventId && e.ClubId == clubId);

                if (eventEntity == null)
                {
                    return new EventRefundResponse
                    {
                        Success = false,
                        Message = "Event not found"
                    };
                }

                // Find the RSVP
                var rsvp = await _context.EventRsvps
                    .Include(r => r.Member)
                    .FirstOrDefaultAsync(r => r.Id == request.RsvpId && r.EventId == request.EventId);

                if (rsvp == null)
                {
                    return new EventRefundResponse
                    {
                        Success = false,
                        Message = "RSVP not found"
                    };
                }

                if (rsvp.PaymentStatus != Domain.Enums.PaymentStatus.Succeeded)
                {
                    return new EventRefundResponse
                    {
                        Success = false,
                        Message = "Payment cannot be refunded"
                    };
                }

                if (string.IsNullOrEmpty(rsvp.StripePaymentIntentId))
                {
                    return new EventRefundResponse
                    {
                        Success = false,
                        Message = "Manual payments cannot be refunded automatically"
                    };
                }

                // Process refund through Stripe before updating local state
                var refundService = new Stripe.RefundService();
                Stripe.Refund stripeRefund;
                var requestOptions = new Stripe.RequestOptions
                {
                    ApiKey = _stripeSettings.SecretKey,
                    IdempotencyKey = $"refund_rsvp_{rsvp.Id}_{rsvp.StripePaymentIntentId}"
                };

                try
                {
                    stripeRefund = await refundService.CreateAsync(new Stripe.RefundCreateOptions
                    {
                        PaymentIntent = rsvp.StripePaymentIntentId,
                        Reason = Stripe.RefundReasons.RequestedByCustomer,
                        Metadata = new Dictionary<string, string>
                        {
                            ["event_id"] = request.EventId.ToString(),
                            ["rsvp_id"] = request.RsvpId.ToString(),
                            ["club_id"] = clubId.ToString()
                        }
                    }, requestOptions);
                }
                catch (StripeException stripeEx)
                {
                    _logger.LogError(stripeEx, "Stripe refund failed for PaymentIntent {PaymentIntentId}", rsvp.StripePaymentIntentId);
                    return new EventRefundResponse
                    {
                        Success = false,
                        Message = "Refund could not be processed. Please try again or contact support."
                    };
                }

                // Update RSVP status to refunded only after Stripe confirms
                rsvp.PaymentStatus = Domain.Enums.PaymentStatus.Refunded;
                rsvp.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send refund confirmation email (non-critical)
                if (rsvp.Member != null)
                {
                    try
                    {
                        var subject = "Refund Confirmation";
                        var body = $"Your payment of {rsvp.PaidAmount:C} for {eventEntity.Name} has been successfully refunded.";
                        await _emailService.SendEmailAsync(rsvp.Member.Email, subject, body);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Failed to send refund confirmation email to {Email}", rsvp.Member.Email);
                    }
                }

                return new EventRefundResponse
                {
                    Success = true,
                    RefundId = stripeRefund.Id,
                    Message = "Refund processed successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund for RSVP {RsvpId}", request.RsvpId);
                return new EventRefundResponse
                {
                    Success = false,
                    Message = "Error processing refund"
                };
            }
        }

        public async Task<ManualPaymentResponse> RecordManualPaymentAsync(int clubId, RecordManualPaymentRequest request)
        {
            // Verify event exists and belongs to club
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId && e.ClubId == clubId);

            if (eventEntity == null)
            {
                throw new ArgumentException($"Event {request.EventId} not found");
            }

            // Verify member exists
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Id == request.MemberId && m.ClubId == clubId);

            if (member == null)
            {
                throw new ArgumentException($"Member {request.MemberId} not found");
            }

            if (request.AmountPaid <= 0)
            {
                throw new ArgumentException("Amount must be greater than 0");
            }

            // Use a transaction to prevent race conditions (duplicate RSVPs)
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Check if RSVP already exists (inside transaction for atomicity)
                var existingRsvp = await _context.EventRsvps
                    .FirstOrDefaultAsync(r => r.EventId == request.EventId && r.MemberId == request.MemberId);

                if (existingRsvp != null)
                {
                    // Update existing RSVP
                    existingRsvp.PaymentStatus = Domain.Enums.PaymentStatus.Succeeded;
                    existingRsvp.PaidAmount = request.AmountPaid;
                    existingRsvp.UpdatedAt = DateTime.UtcNow;
                    existingRsvp.Status = RsvpStatus.Confirmed;
                    existingRsvp.RsvpStatus = "Attending";
                }
                else
                {
                    // Create new RSVP
                    existingRsvp = new EventRsvp
                    {
                        EventId = request.EventId,
                        MemberId = request.MemberId,
                        PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                        PaidAmount = request.AmountPaid,
                        Status = RsvpStatus.Confirmed,
                        RsvpStatus = "Attending",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.EventRsvps.Add(existingRsvp);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ManualPaymentResponse
                {
                    Success = true,
                    RsvpId = existingRsvp.Id,
                    Message = "Manual payment recorded successfully"
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<byte[]> ExportPaymentDataAsync(int clubId, ExportPaymentDataRequest request)
        {
            // Verify event exists and belongs to club
            var eventEntity = await _context.Events
                .Include(e => e.Club)
                .FirstOrDefaultAsync(e => e.Id == request.EventId && e.ClubId == clubId);

            if (eventEntity == null)
            {
                throw new ArgumentException($"Event {request.EventId} not found");
            }

            // Get all RSVPs for the event
            var rsvps = await _context.EventRsvps
                .Include(r => r.Member)
                .Where(r => r.EventId == request.EventId)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            // Calculate total revenue
            var totalRevenue = rsvps
                .Where(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded && r.PaidAmount.HasValue)
                .Sum(r => r.PaidAmount!.Value);

            // Generate CSV content
            var csv = new StringBuilder();
            csv.AppendLine("Name,Email,Member Status,Payment Status,Amount Paid,Payment Method,Payment Date");

            foreach (var rsvp in rsvps)
            {
                var name = rsvp.IsGuestRegistration ? rsvp.GuestName ?? "Guest" : rsvp.Member?.FullName ?? "Unknown";
                var email = rsvp.IsGuestRegistration ? rsvp.GuestEmail ?? "" : rsvp.Member?.Email ?? "";
                var memberStatus = rsvp.IsGuestRegistration ? "guest" : "member";
                var paymentMethod = string.IsNullOrEmpty(rsvp.StripePaymentIntentId) ? "cash" : "stripe";
                var paymentDate = rsvp.UpdatedAt.ToString("yyyy-MM-dd HH:mm");

                csv.AppendLine($"{SanitizeCsvField(name)},{SanitizeCsvField(email)},{memberStatus},{rsvp.PaymentStatus},{rsvp.PaidAmount},{paymentMethod},{paymentDate}");
            }

            // Add summary at the end
            csv.AppendLine("");
            csv.AppendLine("Summary");
            csv.AppendLine($"Total Revenue,{totalRevenue}");
            csv.AppendLine($"Total Attendees,{rsvps.Count}");
            csv.AppendLine($"Completed Payments,{rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded)}");
            csv.AppendLine($"Pending Payments,{rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Pending)}");
            csv.AppendLine($"Failed Payments,{rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Failed)}");
            csv.AppendLine($"Refunded Payments,{rsvps.Count(r => r.PaymentStatus == Domain.Enums.PaymentStatus.Refunded)}");

            return Encoding.UTF8.GetBytes(csv.ToString());
        }

        /// <summary>
        /// Sanitizes a CSV field to prevent formula injection attacks.
        /// Fields starting with =, +, -, or @ are prefixed with a single quote
        /// and wrapped in quotes to neutralize formula execution in spreadsheet applications.
        /// </summary>
        private static string SanitizeCsvField(string? field)
        {
            if (string.IsNullOrEmpty(field))
            {
                return field ?? string.Empty;
            }

            var needsQuoting = false;

            // Escape fields that could be interpreted as formulas
            if (field.StartsWith('=') || field.StartsWith('+') || field.StartsWith('-') || field.StartsWith('@'))
            {
                field = "'" + field;
                needsQuoting = true; // Always quote formula-prefixed fields
            }

            // If field contains commas, quotes, or newlines, wrap in quotes
            if (needsQuoting || field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            {
                field = "\"" + field.Replace("\"", "\"\"") + "\"";
            }

            return field;
        }
    }
}
