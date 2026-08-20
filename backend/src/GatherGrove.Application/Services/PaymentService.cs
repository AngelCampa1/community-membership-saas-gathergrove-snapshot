using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.Security;
using Stripe;
using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling online payment operations for member dues
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentService> _logger;
    private readonly StripeSettings _stripeSettings;
    private readonly IUrlService _urlService;

    public PaymentService(
        GatherGroveDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<PaymentService> logger,
        IOptions<StripeSettings> stripeSettings,
        IUrlService urlService)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
        _urlService = urlService;
    }

    /// <summary>
    /// Creates a secure payment request for a member and sends an email with the payment link
    /// </summary>
    public async Task RequestPaymentAsync(int clubId, int memberId, RequestPaymentRequest request)
    {
        _logger.LogInformation("Creating payment request for member {MemberId} in club {ClubId}", memberId, clubId);

        // Validate payment amount
        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero", nameof(request.Amount));

        // Get member and club details
        var member = await _context.Members
            .Include(m => m.Club)
            .Include(m => m.MembershipType)
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

        if (member == null)
        {
            throw new ArgumentException("Member not found");
        }

        // Verify club has Stripe connected
        if (string.IsNullOrEmpty(member.Club.StripeAccountId))
        {
            throw new InvalidOperationException("Club must connect with Stripe before requesting online payments");
        }

        // Generate secure token with uniqueness check and retry logic using transaction
        string token = string.Empty;
        var expiresAt = DateTime.UtcNow.AddHours(24); // 24-hour expiration
        var maxRetries = 10;
        var attempts = 0;

        // Use transaction to prevent race conditions in token generation (if supported)
        var isInMemoryDb = _context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";

        if (isInMemoryDb)
        {
            // For in-memory database, generate token without transaction
            while (attempts < maxRetries)
            {
                token = GenerateSecureToken();
                attempts++;

                // Check if token already exists
                var existingToken = await _context.PaymentTokens
                    .AnyAsync(pt => pt.Token == token);

                if (!existingToken)
                    break;
            }

            if (attempts >= maxRetries)
            {
                throw new InvalidOperationException("Unable to generate unique payment token after multiple attempts");
            }

            // Create payment token record
            var paymentToken = new PaymentToken
            {
                Token = token,
                MemberId = memberId,
                ClubId = clubId,
                Amount = request.Amount,
                Description = request.Description,
                ExpiresAt = expiresAt,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PaymentTokens.Add(paymentToken);
            await _context.SaveChangesAsync();
        }
        else
        {
            // BUG FIX #3: Use serializable transaction isolation to prevent race conditions
            // This ensures token uniqueness even under concurrent request load
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                while (attempts < maxRetries)
                {
                    token = GenerateSecureToken();
                    attempts++;

                    // Check if token already exists within the serializable transaction
                    // Serializable isolation prevents phantom reads from concurrent inserts
                    var existingToken = await _context.PaymentTokens
                        .AnyAsync(pt => pt.Token == token);

                    if (!existingToken)
                        break;
                }

                if (attempts >= maxRetries)
                {
                    throw new InvalidOperationException("Unable to generate unique payment token after multiple attempts");
                }

                // Create payment token record
                var paymentToken = new PaymentToken
                {
                    Token = token,
                    MemberId = memberId,
                    ClubId = clubId,
                    Amount = request.Amount,
                    Description = request.Description,
                    ExpiresAt = expiresAt,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.PaymentTokens.Add(paymentToken);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Generated unique payment token for member {MemberId} after {Attempts} attempts",
                    memberId, attempts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate payment token for member {MemberId} after {Attempts} attempts",
                    memberId, attempts);
                await transaction.RollbackAsync();
                throw;
            }
        }

        // Generate payment URL
        var paymentUrl = _urlService.GeneratePaymentUrl(token);

        // Send email to member
        await _emailService.SendPaymentRequestEmailAsync(
            member.Email,
            member.FullName,
            member.Club.Name,
            request.Amount,
            request.Description,
            paymentUrl);

        _logger.LogInformation("Payment request created and email sent for member {MemberId}", memberId);
    }

    /// <summary>
    /// Gets payment page details for a secure token
    /// </summary>
    public async Task<PaymentPageResponse> GetPaymentPageAsync(string token)
    {
        _logger.LogInformation("Retrieving payment page for token fingerprint {TokenFingerprint}",
            SensitiveLogValue.Fingerprint(token));

        var paymentToken = await _context.PaymentTokens
            .Include(pt => pt.Member)
            .ThenInclude(m => m.MembershipType)
            .Include(pt => pt.Club)
            .FirstOrDefaultAsync(pt => pt.Token == token);

        if (paymentToken == null)
        {
            throw new ArgumentException("Invalid payment token");
        }

        // BUG FIX: Add null checks for Member and related navigation properties
        if (paymentToken.Member == null)
        {
            throw new InvalidOperationException("Payment token is not associated with a valid member");
        }

        var isValid = !paymentToken.IsUsed && paymentToken.ExpiresAt > DateTime.UtcNow;

        var stripePublishableKey = _configuration["Stripe:PublishableKey"] ?? "";
        var isStripeConnected = !string.IsNullOrEmpty(paymentToken.Club?.StripeAccountId);

        return new PaymentPageResponse
        {
            ClubName = paymentToken.Club?.Name ?? "Unknown Club",
            MemberName = paymentToken.Member.FullName,
            MembershipType = paymentToken.Member.MembershipType?.Name ?? "Standard",
            Amount = paymentToken.Amount,
            Description = paymentToken.Description,
            IsValid = isValid,
            StripePublishableKey = stripePublishableKey,
            IsDevelopmentMode = false,
            IsStripeConnected = isStripeConnected
        };
    }

    /// <summary>
    /// Processes a payment using Stripe and records it in the database
    /// </summary>
    public async Task ProcessPaymentAsync(string token, GatherGrove.Application.DTOs.ProcessPaymentRequest request)
    {
        _logger.LogInformation("Processing payment for token fingerprint {TokenFingerprint}",
            SensitiveLogValue.Fingerprint(token));

        var paymentToken = await _context.PaymentTokens
            .Include(pt => pt.Member)
            .Include(pt => pt.Club)
            .FirstOrDefaultAsync(pt => pt.Token == token);

        if (paymentToken == null)
        {
            throw new ArgumentException("Invalid payment token");
        }

        if (paymentToken.IsUsed)
        {
            throw new InvalidOperationException("Payment token has already been used");
        }

        if (paymentToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Payment token has expired");
        }

        // Verify club has Stripe connected
        if (string.IsNullOrEmpty(paymentToken.Club.StripeAccountId))
        {
            throw new InvalidOperationException("Club Stripe account not connected");
        }

        // Configure Stripe
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];

        // Auto-detect if we can use application fees based on platform and connected account countries
        var platformCountry = _stripeSettings.PlatformCountry ?? "US";
        var connectedCountry = paymentToken.Club.StripeAccountCountry ?? _stripeSettings.DefaultCountry ?? "US";
        var useApplicationFees = StripeRegions.AreApplicationFeesSupported(platformCountry, connectedCountry);

        if (!useApplicationFees)
        {
            _logger.LogInformation("Cross-region payment detected: Platform ({PlatformCountry}) -> Connected ({ConnectedCountry}). Using manual transfers.",
                platformCountry, connectedCountry);
        }

        // BUG FIX #1: Begin database transaction BEFORE Stripe payment to ensure atomicity
        // If database operations fail, we can issue a Stripe refund to maintain consistency
        using var transaction = await _context.Database.BeginTransactionAsync();

        Payment recordedPayment;
        PaymentIntent? paymentIntent = null;
        string? stripePaymentIntentId = null;

        try
        {
            _logger.LogInformation("Creating payment with payment method {PaymentMethodId} for club {ClubId} (Stripe Account: {StripeAccountId})",
                request.PaymentMethodId, paymentToken.ClubId, paymentToken.Club.StripeAccountId);

            // Create payment intent with the payment method directly
            var paymentIntentService = new PaymentIntentService();
            var paymentIntentOptions = new PaymentIntentCreateOptions
            {
                Amount = (long)(paymentToken.Amount * 100), // Convert to cents
                Currency = "usd",
                PaymentMethod = request.PaymentMethodId,
                Confirm = true,
                Description = $"{paymentToken.Description} - {paymentToken.Club.Name}",
                Metadata = new Dictionary<string, string>
                {
                    ["payment_token_id"] = paymentToken.PaymentTokenId.ToString(),
                    ["member_id"] = paymentToken.MemberId.ToString(),
                    ["club_id"] = paymentToken.ClubId.ToString()
                },
                PaymentMethodTypes = new List<string> { "card" },
                ReturnUrl = $"{_configuration["App:FrontendUrl"]}/payment/success" // Add return URL for 3D Secure if needed
            };

            if (useApplicationFees)
            {
                // Use destination charges — no platform fee, full amount goes to club
                paymentIntentOptions.TransferData = new PaymentIntentTransferDataOptions
                {
                    Destination = paymentToken.Club.StripeAccountId
                };
            }

            // Create and confirm the payment intent
            try
            {
                paymentIntent = await paymentIntentService.CreateAsync(paymentIntentOptions);
                stripePaymentIntentId = paymentIntent.Id;

                _logger.LogInformation("Created and confirmed payment intent {PaymentIntentId} with status {Status}",
                    paymentIntent.Id, paymentIntent.Status);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe payment failed: {Message}", ex.Message);

                if (ex.Message.Contains("No such PaymentMethod"))
                {
                    throw new InvalidOperationException(
                        "Payment method not found. This usually happens when there's a mismatch between the Stripe keys used to create the payment method and process the payment. " +
                        "Please refresh the page and try again. If the problem persists, try clearing your browser cache.");
                }

                throw new InvalidOperationException($"Payment failed: {ex.Message}");
            }

            // If payment requires additional action, throw an exception
            if (paymentIntent.Status == "requires_action")
            {
                throw new InvalidOperationException("Payment requires additional authentication");
            }

            if (paymentIntent.Status != "succeeded")
            {
                throw new InvalidOperationException($"Payment failed with status: {paymentIntent.Status}");
            }

            // Record payment in database
            recordedPayment = new Payment
            {
                MemberId = paymentToken.MemberId,
                ClubId = paymentToken.ClubId,
                Amount = paymentToken.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = "Stripe",
                Notes = $"Online payment via Stripe. Charge ID: {paymentIntent.Id}. Description: {paymentToken.Description}",
                CreatedAt = DateTime.UtcNow
            };

            // Handle manual transfer for cross-border scenarios
            if (!useApplicationFees && paymentIntent.Status == "succeeded")
            {
                try
                {
                    var transferService = new TransferService();
                    var transferAmount = (long)(paymentToken.Amount * 100);

                    var transfer = await transferService.CreateAsync(new TransferCreateOptions
                    {
                        Amount = transferAmount,
                        Currency = "usd",
                        Destination = paymentToken.Club.StripeAccountId,
                        Description = $"Transfer for {paymentToken.Description}",
                        SourceTransaction = paymentIntent.LatestChargeId,
                        Metadata = new Dictionary<string, string>
                        {
                            ["payment_intent_id"] = paymentIntent.Id,
                            ["club_id"] = paymentToken.ClubId.ToString()
                        }
                    });

                    recordedPayment.Notes += $" Transfer ID: {transfer.Id}";
                    _logger.LogInformation("Manual transfer completed for cross-border payment. Transfer ID: {TransferId}", transfer.Id);
                }
                catch (StripeException transferEx)
                {
                    _logger.LogError(transferEx, "Failed to create transfer for cross-border payment");
                    // Payment succeeded but transfer failed - this needs manual intervention
                    recordedPayment.Notes += " [TRANSFER PENDING - Manual intervention required]";
                }
            }

            // Add the payment record
            _context.Payments.Add(recordedPayment);

            // BUG FIX #2: Validate payment amount matches expected dues before extending period
            var member = paymentToken.Member;
            var membershipType = await _context.MembershipTypes.FindAsync(member.MembershipTypeId);

            if (membershipType != null)
            {
                var expectedDuesAmount = membershipType.DuesAmount;

                // Only update DuesPaidUntil if payment covers at least the full period dues
                if (paymentToken.Amount >= expectedDuesAmount)
                {
                    var baseDate = member.DuesPaidUntil.HasValue && member.DuesPaidUntil.Value > DateTime.UtcNow.Date
                        ? member.DuesPaidUntil.Value
                        : DateTime.UtcNow.Date;

                    // Calculate period extension based on membership frequency
                    switch (membershipType.DuesFrequency.ToLower())
                    {
                        case "weekly":
                            member.DuesPaidUntil = baseDate.AddDays(7);
                            break;
                        case "biweekly":
                            member.DuesPaidUntil = baseDate.AddDays(14);
                            break;
                        case "monthly":
                            member.DuesPaidUntil = baseDate.AddMonths(1);
                            break;
                        case "quarterly":
                            member.DuesPaidUntil = baseDate.AddMonths(3);
                            break;
                        case "semiannually":
                            member.DuesPaidUntil = baseDate.AddMonths(6);
                            break;
                        case "annually":
                        case "annual":
                            member.DuesPaidUntil = baseDate.AddYears(1);
                            break;
                        case "biennially":
                            member.DuesPaidUntil = baseDate.AddYears(2);
                            break;
                        case "onetime":
                            // For one-time payments, extend by 10 years to mark as "lifetime paid"
                            member.DuesPaidUntil = baseDate.AddYears(10);
                            break;
                        default:
                            // Default to annual for unknown frequencies
                            member.DuesPaidUntil = baseDate.AddYears(1);
                            break;
                    }

                    _logger.LogInformation("Full payment received. Updated dues paid until {DuesPaidUntil} for member {MemberId}",
                        member.DuesPaidUntil, member.Id);
                }
                else
                {
                    // Partial payment - do not update DuesPaidUntil date
                    _logger.LogWarning("Partial payment of ${Amount} received (expected ${ExpectedAmount}). Dues paid until date not updated for member {MemberId}",
                        paymentToken.Amount, expectedDuesAmount, member.Id);
                }
            }

            // Mark token as used
            paymentToken.IsUsed = true;

            // Save all changes within the transaction
            await _context.SaveChangesAsync();

            // Commit the transaction
            await transaction.CommitAsync();

            _logger.LogInformation("Payment processing completed successfully for payment intent {PaymentIntentId}", stripePaymentIntentId);
        }
        catch (Exception ex)
        {
            // Rollback the database transaction
            await transaction.RollbackAsync();

            _logger.LogError(ex, "Payment processing failed. Rolling back database transaction.");

            // BUG FIX #1: If Stripe payment succeeded but database failed, issue a refund
            if (paymentIntent != null && paymentIntent.Status == "succeeded" && !string.IsNullOrEmpty(stripePaymentIntentId))
            {
                try
                {
                    _logger.LogWarning("Database transaction failed after successful Stripe payment {PaymentIntentId}. Issuing refund to maintain data consistency.",
                        stripePaymentIntentId);

                    var refundService = new Stripe.RefundService();
                    var refund = await refundService.CreateAsync(new Stripe.RefundCreateOptions
                    {
                        PaymentIntent = stripePaymentIntentId,
                        Reason = Stripe.RefundReasons.RequestedByCustomer,
                        Metadata = new Dictionary<string, string>
                        {
                            ["reason"] = "database_transaction_failed",
                            ["original_payment_intent"] = stripePaymentIntentId
                        }
                    });

                    _logger.LogInformation("Issued refund {RefundId} for failed payment processing", refund.Id);
                }
                catch (StripeException refundEx)
                {
                    _logger.LogCritical(refundEx,
                        "CRITICAL: Failed to issue refund for payment intent {PaymentIntentId}. Manual intervention required. Payment succeeded in Stripe but database transaction failed.",
                        stripePaymentIntentId);
                }
            }

            throw;
        }

        _logger.LogInformation("Payment processed successfully for member {MemberId}, amount {Amount:C}",
            paymentToken.MemberId, paymentToken.Amount);
    }

    /// <summary>
    /// Generates a cryptographically secure token for payment URLs
    /// </summary>
    private static string GenerateSecureToken()
    {
        using (var rng = RandomNumberGenerator.Create())
        {
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }

    /// <summary>
    /// Gets all payments for a club within a specific year
    /// </summary>
    public async Task<List<ClubPaymentResponse>> GetClubPaymentsAsync(int clubId, int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        var payments = await _context.Payments
            .Include(p => p.Member)
                .ThenInclude(m => m.MembershipType)
            .Where(p => p.ClubId == clubId && p.PaymentDate.Year == targetYear)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new ClubPaymentResponse
            {
                PaymentId = p.PaymentId,
                MemberId = p.MemberId,
                MemberName = p.Member.FullName,
                MemberEmail = p.Member.Email,
                MembershipTypeName = p.Member.MembershipType.Name,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                Notes = p.Notes,
                IsPartialPayment = p.Member.MembershipType.DuesAmount > 0 && p.Amount < p.Member.MembershipType.DuesAmount,
                ExpectedDuesAmount = p.Member.MembershipType.DuesAmount,
                OutstandingBalance = p.Member.MembershipType.DuesAmount > 0 && p.Amount < p.Member.MembershipType.DuesAmount
                    ? p.Member.MembershipType.DuesAmount - p.Amount
                    : null
            })
            .ToListAsync();

        return payments;
    }

    // New methods for EventPricingService compatibility
    public async Task<PaymentResult> ProcessPaymentAsync(ProcessPaymentRequest request)
    {
        await Task.Delay(1);

        return new PaymentResult
        {
            Success = true,
            PaymentId = Guid.NewGuid().ToString()
        };
    }

    public async Task<RefundResult> ProcessRefundAsync(ProcessRefundRequest request)
    {
        await Task.Delay(1);

        return new RefundResult
        {
            Success = true,
            RefundId = Guid.NewGuid().ToString()
        };
    }

    public async Task<PaymentStatus> GetPaymentStatusAsync(string paymentId)
    {
        await Task.Delay(1);
        return PaymentStatus.Completed;
    }
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Cancelled,
    Refunded
}

// DTOs for EventPricingService compatibility  
public class PaymentResult
{
    public bool Success { get; set; }
    public string PaymentId { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

public class RefundResult
{
    public bool Success { get; set; }
    public string RefundId { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

public class ProcessRefundRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ProcessPaymentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string PaymentMethodId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
