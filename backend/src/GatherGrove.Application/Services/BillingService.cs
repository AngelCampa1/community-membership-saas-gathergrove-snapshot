using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing billing and subscription operations with Stripe
/// </summary>
public class BillingService : IBillingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<BillingService> _logger;
    private readonly StripeSettings _stripeSettings;
    private readonly IAdminService _adminService;
    private readonly IMemberActivationService _memberActivationService;
    private readonly IPromotionService _promotionService;

    public BillingService(
        GatherGroveDbContext context,
        ILogger<BillingService> logger,
        IOptions<StripeSettings> stripeSettings,
        IAdminService adminService,
        IMemberActivationService memberActivationService,
        IPromotionService promotionService)
    {
        _context = context;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
        _adminService = adminService;
        _memberActivationService = memberActivationService;
        _promotionService = promotionService;
        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    /// <summary>
    /// Gets the current billing status and subscription information for a club
    /// </summary>
    public async Task<BillingStatusResponse> GetBillingStatusAsync(int clubId)
    {
        _logger.LogInformation("Getting billing status for club {ClubId}", clubId);

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        var memberCount = await _context.Members
            .Where(m => m.ClubId == clubId && m.Status == "Active")
            .CountAsync();

        // Get discount info from Stripe subscription if active
        string? appliedPromotionName = null;
        string? activeDiscountDescription = null;
        if (!string.IsNullOrEmpty(club.StripeSubscriptionId))
        {
            var discountInfo = await GetSubscriptionDiscountInfoAsync(club.StripeSubscriptionId);
            appliedPromotionName = discountInfo.promotionName;
            activeDiscountDescription = discountInfo.discountDescription;
        }

        var access = BillingAccessPolicy.Evaluate(club, DateTime.UtcNow);

        return new BillingStatusResponse
        {
            CurrentTier = GetDisplayTierName(club.Tier),
            HasActiveSubscription = !string.IsNullOrEmpty(club.StripeSubscriptionId) &&
                                 access.NormalizedStatus == "active",
            MemberCount = memberCount,
            MemberLimit = GetMemberLimitForTier(club.Tier),
            NextBillingDate = !string.IsNullOrEmpty(club.StripeSubscriptionId)
                ? await GetNextBillingDateAsync(club.StripeSubscriptionId)
                : null,
            CanUpgrade = !IsTopTier(club.Tier) && !access.AccountLocked,
            SubscriptionId = club.StripeSubscriptionId,
            SubscriptionStatus = club.SubscriptionStatus,
            BillingCycle = await GetBillingCycleFromSubscriptionAsync(club.StripeSubscriptionId),
            AppliedPromotionName = appliedPromotionName,
            ActiveDiscountDescription = activeDiscountDescription,
            TrialStatus = access.TrialStatus,
            TrialEndsAt = club.TrialExpiresAt,
            RequiresPaymentSetup = access.RequiresPaymentSetup,
            AccountLocked = access.AccountLocked,
            CanAccessApp = access.CanAccessApp
        };
    }

    /// <summary>
    /// Upgrades a club's subscription to a higher tier or different billing cycle using Stripe
    /// </summary>
    public async Task<UpgradeSubscriptionResponse> UpgradeSubscriptionAsync(int clubId, UpgradeSubscriptionRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        _logger.LogInformation("Upgrading subscription for club {ClubId} to plan {PlanId}", clubId, request.PlanId);

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        request.BillingCycle = string.IsNullOrWhiteSpace(request.BillingCycle) ? "monthly" : request.BillingCycle;
        request.TargetTier = NormalizeRequestedTierName(
            string.IsNullOrWhiteSpace(request.TargetTier) ? "Seed" : request.TargetTier);

        // Validate the plan upgrade path
        ValidateUpgradePath(club.Tier, request.TargetTier);

        // Validate plan ID matches the expected price ID
        if (!IsValidPlanId(request.PlanId, request.TargetTier, request.BillingCycle))
        {
            throw new ArgumentException("Invalid plan ID for the specified tier and billing cycle", nameof(request.PlanId));
        }

        // Determine which promotion to apply (if any) - fetched directly from Stripe
        string? stripeCouponId = null;
        string? appliedPromotionName = null;
        string? appliedDiscountDescription = null;

        // First, check if user provided a promo code
        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var validationResult = await _promotionService.ValidatePromoCodeAsync(request.PromoCode);
            if (validationResult.IsValid && validationResult.Promotion != null)
            {
                stripeCouponId = await _promotionService.GetStripeCouponIdAsync(request.PromoCode);
                appliedPromotionName = validationResult.Promotion.Name;
                appliedDiscountDescription = validationResult.Promotion.DiscountDescription;
                _logger.LogInformation("Applying user-provided promo code: {PromoCode} -> Coupon: {CouponId}",
                    request.PromoCode, stripeCouponId);
            }
            else
            {
                _logger.LogWarning("Invalid promo code provided: {PromoCode} - {Error}",
                    request.PromoCode, validationResult.ErrorMessage);
                return new UpgradeSubscriptionResponse
                {
                    Status = "failed",
                    Message = validationResult.ErrorMessage ?? "Invalid promo code"
                };
            }
        }
        else
        {
            // Check for auto-display promotion from Stripe (with auto_display metadata)
            var activePromo = await _promotionService.GetActivePromotionResponseAsync();
            if (activePromo?.HasActivePromotion == true && activePromo.Promotion != null)
            {
                stripeCouponId = await _promotionService.GetStripeCouponIdAsync(activePromo.Promotion.PromoCode!);
                appliedPromotionName = activePromo.Promotion.Name;
                appliedDiscountDescription = activePromo.Promotion.DiscountDescription;
                _logger.LogInformation("Auto-applying promotion from Stripe: {PromotionName} -> Coupon: {CouponId}",
                    appliedPromotionName, stripeCouponId);
            }
        }

        try
        {
            // Get or create Stripe customer
            var customerId = await GetOrCreateCustomerAsync(club);

            // Attach payment method to customer
            var paymentMethodService = new PaymentMethodService();
            await paymentMethodService.AttachAsync(request.PaymentMethodId, new PaymentMethodAttachOptions
            {
                Customer = customerId
            });

            // Create or update subscription with optional coupon
            var subscriptionService = new SubscriptionService();
            Subscription subscription;
            if (!string.IsNullOrEmpty(club.StripeSubscriptionId))
            {
                var existingSubscription = await subscriptionService.GetAsync(club.StripeSubscriptionId);
                var existingItemId = existingSubscription.Items?.Data?.FirstOrDefault()?.Id;
                if (string.IsNullOrEmpty(existingItemId))
                {
                    throw new InvalidOperationException("Unable to find subscription item for update.");
                }

                var updateOptions = new SubscriptionUpdateOptions
                {
                    Items = new List<SubscriptionItemOptions>
                    {
                        new SubscriptionItemOptions
                        {
                            Id = existingItemId,
                            Price = request.PlanId
                        }
                    },
                    DefaultPaymentMethod = request.PaymentMethodId,
                    CollectionMethod = "charge_automatically"
                };

                if (!string.IsNullOrEmpty(stripeCouponId))
                {
                    updateOptions.Discounts = new List<SubscriptionDiscountOptions>
                    {
                        new SubscriptionDiscountOptions
                        {
                            Coupon = stripeCouponId
                        }
                    };
                }

                subscription = await subscriptionService.UpdateAsync(club.StripeSubscriptionId, updateOptions);
            }
            else
            {
                var subscriptionOptions = new SubscriptionCreateOptions
                {
                    Customer = customerId,
                    Items = new List<SubscriptionItemOptions>
                    {
                        new SubscriptionItemOptions
                        {
                            Price = request.PlanId
                        }
                    },
                    DefaultPaymentMethod = request.PaymentMethodId,
                    CollectionMethod = "charge_automatically",
                    Expand = new List<string> { "latest_invoice" }
                };

                if (!string.IsNullOrEmpty(stripeCouponId))
                {
                    subscriptionOptions.Discounts = new List<SubscriptionDiscountOptions>
                    {
                        new SubscriptionDiscountOptions
                        {
                            Coupon = stripeCouponId
                        }
                    };
                    _logger.LogInformation("Applying Stripe coupon {CouponId} to subscription for club {ClubId}",
                        stripeCouponId, clubId);
                }

                subscription = await subscriptionService.CreateAsync(subscriptionOptions);
            }

            // Update club with subscription details
            club.StripeSubscriptionId = subscription.Id;
            club.SubscriptionStatus = NormalizeSubscriptionStatus(subscription.Status);
            club.Tier = request.TargetTier;
            club.TrialExpiresAt = subscription.TrialEnd?.ToUniversalTime();

            await _context.SaveChangesAsync();

            // Note: Stripe automatically tracks redemption count - no need for local tracking

            // Upon successful upgrade from trial/pending state to paid tier, trigger activation emails
            // for all existing members who haven't yet activated their accounts
            if (string.Equals(request.TargetTier, "Grow", StringComparison.OrdinalIgnoreCase) ||
                IsTopTier(request.TargetTier))
            {
                await TriggerMemberActivationEmailsAsync(clubId);
            }

            // Get next billing date from subscription items
            DateTime? nextBillingDate = null;
            if (subscription.Items?.Data?.Any() == true)
            {
                var firstItem = subscription.Items.Data.FirstOrDefault();
                nextBillingDate = firstItem?.CurrentPeriodEnd;
            }

            var successMessage = "Subscription upgraded successfully";
            if (appliedPromotionName != null)
            {
                successMessage += $" with promotion: {appliedPromotionName}";
            }

            return new UpgradeSubscriptionResponse
            {
                SubscriptionId = subscription.Id,
                NewTier = GetDisplayTierName(club.Tier),
                NextBillingDate = nextBillingDate ?? DateTime.UtcNow.AddMonths(1),
                Status = NormalizeSubscriptionStatus(subscription.Status),
                Message = successMessage,
                AppliedPromotionName = appliedPromotionName,
                AppliedDiscountDescription = appliedDiscountDescription
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error during subscription upgrade for club {ClubId}: {StripeError}",
                clubId, ex.Message);
            return new UpgradeSubscriptionResponse
            {
                Status = "failed",
                Message = "Payment processing error. Please check your payment method and try again."
            };
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error during subscription upgrade for club {ClubId}", clubId);
            return new UpgradeSubscriptionResponse
            {
                Status = "failed",
                Message = "Database error occurred. Please contact support if this persists."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during subscription upgrade for club {ClubId}", clubId);
            return new UpgradeSubscriptionResponse
            {
                Status = "failed",
                Message = "An unexpected error occurred. Please contact support."
            };
        }
    }

    /// <summary>
    /// Claims a 30-day trial by creating a Stripe trial subscription with CC on file that auto-charges.
    /// </summary>
    public async Task<ClaimTrialResponse> ClaimTrialAsync(int clubId, string targetTier, string paymentMethodId, string billingCycle = "monthly")
    {
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        targetTier = NormalizeRequestedTierName(targetTier);

        if (!string.Equals(targetTier, "Seed", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(targetTier, "Grow", StringComparison.OrdinalIgnoreCase) &&
            !IsTopTier(targetTier))
        {
            throw new InvalidOperationException("Trials can only be claimed for Seed, Grow, or Expand tiers.");
        }

        if (string.IsNullOrWhiteSpace(paymentMethodId))
        {
            throw new InvalidOperationException("A payment method is required to start a trial.");
        }

        var normalizedStatus = NormalizeSubscriptionStatus(club.SubscriptionStatus);
        if (!string.Equals(normalizedStatus, "inactive", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("This club has already started a trial or paid subscription.");
        }

        var owner = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == club.CreatedByUserId);

        if (owner == null || !owner.OnboardingCompleted)
        {
            throw new InvalidOperationException("Complete onboarding before claiming a trial.");
        }

        var customerId = await GetOrCreateCustomerAsync(club);

        // Attach payment method to customer
        var paymentMethodService = new PaymentMethodService();
        await paymentMethodService.AttachAsync(paymentMethodId, new PaymentMethodAttachOptions
        {
            Customer = customerId
        });

        // Set as default payment method
        var customerService = new CustomerService();
        await customerService.UpdateAsync(customerId, new CustomerUpdateOptions
        {
            InvoiceSettings = new CustomerInvoiceSettingsOptions
            {
                DefaultPaymentMethod = paymentMethodId
            }
        });

        var priceId = (targetTier.ToLower(), (billingCycle ?? "monthly").ToLower()) switch
        {
            ("seed", "annual") => _stripeSettings.SeedAnnualPriceId,
            ("seed", "monthly") => _stripeSettings.SeedMonthlyPriceId,
            ("expand", "annual") => _stripeSettings.UnlimitedAnnualPriceId,
            ("expand", "monthly") => _stripeSettings.UnlimitedMonthlyPriceId,
            ("unlimited", "annual") => _stripeSettings.UnlimitedAnnualPriceId,
            ("unlimited", "monthly") => _stripeSettings.UnlimitedMonthlyPriceId,
            ("grow", "annual") => _stripeSettings.GrowAnnualPriceId,
            ("grow", "monthly") => _stripeSettings.GrowMonthlyPriceId,
            _ => throw new ArgumentException($"Invalid tier '{targetTier}' or billing cycle '{billingCycle}'")
        };

        var subscriptionService = new SubscriptionService();
        var subscription = await subscriptionService.CreateAsync(new SubscriptionCreateOptions
        {
            Customer = customerId,
            Items = new List<SubscriptionItemOptions>
            {
                new SubscriptionItemOptions
                {
                    Price = priceId
                }
            },
            TrialPeriodDays = 30,
            CollectionMethod = "charge_automatically",
            Expand = new List<string> { "latest_invoice" }
        });

        club.StripeSubscriptionId = subscription.Id;
        club.Tier = NormalizeRequestedTierName(targetTier);
        club.SubscriptionStatus = NormalizeSubscriptionStatus(subscription.Status);
        club.TrialExpiresAt = subscription.TrialEnd?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(30);
        await _context.SaveChangesAsync();

        return new ClaimTrialResponse
        {
            Success = true,
            Message = $"Your 30-day {GetDisplayTierName(club.Tier)} trial is now active.",
            SubscriptionId = subscription.Id,
            TrialEndsAt = club.TrialExpiresAt
        };
    }

    /// <summary>
    /// Creates a Stripe-hosted customer portal session for payment updates.
    /// </summary>
    public async Task<CreateCustomerPortalSessionResponse> CreateCustomerPortalSessionAsync(int clubId)
    {
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        var customerId = await GetOrCreateCustomerAsync(club);
        var portalService = new Stripe.BillingPortal.SessionService();
        var session = await portalService.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = $"{_stripeSettings.Domain.TrimEnd('/')}/admin/billing"
        });

        return new CreateCustomerPortalSessionResponse
        {
            Url = session.Url
        };
    }

    /// <summary>
    /// Cancels an active subscription.
    /// </summary>
    public async Task<bool> CancelSubscriptionAsync(int clubId)
    {
        _logger.LogInformation("Cancelling subscription for club {ClubId}", clubId);

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException("Club not found");
        }

        if (string.IsNullOrEmpty(club.StripeSubscriptionId))
        {
            throw new InvalidOperationException("No active subscription to cancel");
        }

        try
        {
            var subscriptionService = new SubscriptionService();
            var subscription = await subscriptionService.CancelAsync(club.StripeSubscriptionId, new SubscriptionCancelOptions
            {
                CancellationDetails = new SubscriptionCancellationDetailsOptions
                {
                    Comment = "Cancelled by customer"
                }
            });

            club.SubscriptionStatus = NormalizeSubscriptionStatus(subscription.Status);
            // Do NOT reset club.Tier — account is locked via subscription status "canceled"
            // (IsAccountLocked() checks SubscriptionStatus, not Tier)
            club.TrialExpiresAt = null;
            club.StripeSubscriptionId = null;

            await _context.SaveChangesAsync();

            // Handle tier downgrade by cancelling pending admin invitations
            await _adminService.HandleTierDowngradeAsync(clubId);

            _logger.LogInformation("Successfully cancelled subscription for club {ClubId}", clubId);
            return true;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to cancel subscription for club {ClubId}: {StripeError}",
                clubId, ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Processes webhook events from Stripe to keep subscription status in sync
    /// </summary>
    public async Task<bool> ProcessWebhookAsync(string json, string stripeSignature)
    {
        if (json == null)
        {
            throw new ArgumentNullException(nameof(json));
        }

        if (stripeSignature == null)
        {
            throw new ArgumentNullException(nameof(stripeSignature));
        }

        if (string.IsNullOrEmpty(json))
        {
            throw new ArgumentException("Webhook payload cannot be empty", nameof(json));
        }

        if (string.IsNullOrEmpty(stripeSignature))
        {
            throw new ArgumentException("Stripe signature cannot be empty", nameof(stripeSignature));
        }

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, _stripeSettings.WebhookSecret);
            _logger.LogInformation("Processing Stripe webhook event: {EventType}", stripeEvent.Type);

            switch (stripeEvent.Type)
            {
                case "customer.subscription.updated":
                case "customer.subscription.paused":
                case "customer.subscription.resumed":
                    await HandleSubscriptionUpdated(stripeEvent);
                    break;
                case "customer.subscription.deleted":
                    await HandleSubscriptionDeleted(stripeEvent);
                    break;
                case "invoice.payment_succeeded":
                    await HandleInvoicePaymentSucceeded(stripeEvent);
                    break;
                case "invoice.payment_failed":
                    await HandleInvoicePaymentFailed(stripeEvent);
                    break;
                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return true;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to process Stripe webhook: {StripeError}", ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Gets or creates a Stripe customer for the club
    /// </summary>
    private async Task<string> GetOrCreateCustomerAsync(Club club)
    {
        if (!string.IsNullOrEmpty(club.StripeCustomerId))
        {
            return club.StripeCustomerId;
        }

        var ownerEmail = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == club.CreatedByUserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();

        var customerService = new CustomerService();
        var customer = await customerService.CreateAsync(new CustomerCreateOptions
        {
            Email = string.IsNullOrWhiteSpace(ownerEmail)
                ? $"admin+club{club.Id}@example.com"
                : ownerEmail,
            Name = club.Name,
            Metadata = new Dictionary<string, string>
            {
                ["club_id"] = club.Id.ToString()
            }
        });

        club.StripeCustomerId = customer.Id;
        await _context.SaveChangesAsync();

        return customer.Id;
    }

    /// <summary>
    /// Gets discount information from a Stripe subscription
    /// </summary>
    private async Task<(string? promotionName, string? discountDescription)> GetSubscriptionDiscountInfoAsync(string subscriptionId)
    {
        if (string.IsNullOrEmpty(subscriptionId))
        {
            return (null, null);
        }

        try
        {
            var subscriptionService = new SubscriptionService();
            var subscription = await subscriptionService.GetAsync(subscriptionId, new SubscriptionGetOptions
            {
                Expand = new List<string> { "discounts.coupon" }
            });

            // Check the discounts collection (new Stripe API structure)
            if (subscription.Discounts != null && subscription.Discounts.Any())
            {
                var firstDiscount = subscription.Discounts.First();
                if (firstDiscount.Coupon != null)
                {
                    var coupon = firstDiscount.Coupon;
                    var name = coupon.Name ?? "Discount Applied";
                    var description = GetCouponDiscountDescription(coupon);
                    return (name, description);
                }
            }

            return (null, null);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to retrieve discount info from Stripe for subscription {SubscriptionId}", subscriptionId);
            return (null, null);
        }
    }

    /// <summary>
    /// Generates a human-readable discount description from a Stripe coupon
    /// </summary>
    private static string GetCouponDiscountDescription(Coupon coupon)
    {
        string discountPart;
        if (coupon.PercentOff.HasValue)
        {
            discountPart = $"{coupon.PercentOff:0}% off";
        }
        else if (coupon.AmountOff.HasValue)
        {
            var amount = coupon.AmountOff.Value / 100m;
            var currency = coupon.Currency?.ToUpper() ?? "USD";
            discountPart = $"${amount:0.00} {currency} off";
        }
        else
        {
            discountPart = "Discount";
        }

        string durationPart = coupon.Duration switch
        {
            "once" => " (first invoice)",
            "forever" => " forever",
            "repeating" when coupon.DurationInMonths.HasValue =>
                $" for {coupon.DurationInMonths} month{(coupon.DurationInMonths > 1 ? "s" : "")}",
            _ => string.Empty
        };

        return discountPart + durationPart;
    }

    private async Task<DateTime?> GetNextBillingDateAsync(string subscriptionId)
    {
        if (string.IsNullOrEmpty(subscriptionId))
        {
            return null;
        }

        try
        {
            var subscriptionService = new SubscriptionService();
            var subscription = await subscriptionService.GetAsync(subscriptionId);

            // Get next billing date from subscription items
            if (subscription.Items?.Data?.Any() == true)
            {
                var firstItem = subscription.Items.Data.FirstOrDefault();
                return firstItem?.CurrentPeriodEnd;
            }

            return null;
        }
        catch (StripeException ex)
        {
            // SECURITY FIX: Log Stripe payment failures for audit trail and debugging
            _logger.LogError(ex, "Failed to retrieve next billing date from Stripe for subscription {SubscriptionId}. " +
                "Error Code: {ErrorCode}, Error Type: {ErrorType}",
                subscriptionId, ex.StripeError?.Code, ex.StripeError?.Type);
            return null;
        }
    }

    private async Task HandleSubscriptionUpdated(Stripe.Event stripeEvent)
    {
        var subscription = (Subscription)stripeEvent.Data.Object;
        var club = await _context.Clubs.FirstOrDefaultAsync(c => c.StripeSubscriptionId == subscription.Id);

        if (club != null)
        {
            club.SubscriptionStatus = NormalizeSubscriptionStatus(subscription.Status);
            club.TrialExpiresAt = subscription.TrialEnd?.ToUniversalTime() ?? club.TrialExpiresAt;

            // Update tier based on the price ID from subscription
            if (subscription.Items?.Data?.Any() == true)
            {
                var firstItem = subscription.Items.Data.FirstOrDefault();
                if (firstItem?.Price?.Id != null)
                {
                    var priceId = firstItem.Price.Id;
                    club.Tier = GetTierFromPriceId(priceId);
                }
            }

            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Handles subscription deleted webhook events
    /// </summary>
    private async Task HandleSubscriptionDeleted(Stripe.Event stripeEvent)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var club = await _context.Clubs
            .FirstOrDefaultAsync(c => c.StripeSubscriptionId == subscription.Id);

        if (club != null)
        {
            _logger.LogInformation("Updating club {ClubId} subscription status to canceled due to subscription deletion", club.Id);
            // Do NOT reset club.Tier — account locks via subscription status "canceled"
            // (IsAccountLocked() checks SubscriptionStatus, preserving original tier)
            club.SubscriptionStatus = "canceled";
            club.StripeSubscriptionId = null;
            await _context.SaveChangesAsync();

            // Handle tier downgrade by cancelling pending admin invitations
            await _adminService.HandleTierDowngradeAsync(club.Id);
        }
    }

    /// <summary>
    /// D-004 FIX: Extracts the Stripe subscription id from an invoice across every
    /// location the current Stripe API model can expose it.
    ///
    /// The previous logic only inspected <c>line.Parent.InvoiceItemDetails.Subscription</c>,
    /// which is populated for ONE-OFF invoice items only. Subscription RENEWAL invoices
    /// (the common case driving invoice.payment_succeeded / invoice.payment_failed) expose
    /// the subscription on the invoice itself (<c>invoice.Parent.SubscriptionDetails</c>)
    /// and on subscription line items (<c>line.Parent.SubscriptionItemDetails</c>), so the
    /// old code silently found nothing and NEVER reconciled the club's status. A failed
    /// renewal therefore never flipped the club to "past_due" (account-lock relies on
    /// SubscriptionStatus), and a recovered payment never restored "active".
    ///
    /// Resolution order: invoice-level details first (most reliable), then subscription
    /// line items, then legacy one-off invoice-item lines.
    /// </summary>
    public static string? ExtractSubscriptionIdFromInvoice(Invoice invoice)
    {
        if (invoice == null)
        {
            return null;
        }

        var invoiceLevel = invoice.Parent?.SubscriptionDetails?.SubscriptionId;
        if (!string.IsNullOrEmpty(invoiceLevel))
        {
            return invoiceLevel;
        }

        if (invoice.Lines?.Data != null)
        {
            foreach (var lineItem in invoice.Lines.Data)
            {
                var subscriptionLine = lineItem.Parent?.SubscriptionItemDetails?.Subscription;
                if (!string.IsNullOrEmpty(subscriptionLine))
                {
                    return subscriptionLine;
                }

                var invoiceItemLine = lineItem.Parent?.InvoiceItemDetails?.Subscription;
                if (!string.IsNullOrEmpty(invoiceItemLine))
                {
                    return invoiceItemLine;
                }
            }
        }

        return null;
    }

    private async Task HandleInvoicePaymentSucceeded(Stripe.Event stripeEvent)
    {
        var invoice = (Invoice)stripeEvent.Data.Object;

        var subscriptionId = ExtractSubscriptionIdFromInvoice(invoice);

        if (!string.IsNullOrEmpty(subscriptionId))
        {
            var club = await _context.Clubs.FirstOrDefaultAsync(c => c.StripeSubscriptionId == subscriptionId);
            if (club != null)
            {
                club.SubscriptionStatus = "active";
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task HandleInvoicePaymentFailed(Stripe.Event stripeEvent)
    {
        var invoice = (Invoice)stripeEvent.Data.Object;

        var subscriptionId = ExtractSubscriptionIdFromInvoice(invoice);

        if (!string.IsNullOrEmpty(subscriptionId))
        {
            var club = await _context.Clubs.FirstOrDefaultAsync(c => c.StripeSubscriptionId == subscriptionId);
            if (club != null)
            {
                club.SubscriptionStatus = "past_due";
                await _context.SaveChangesAsync();
            }
        }
    }

    /// <summary>
    /// Triggers activation emails for all existing members who haven't yet activated their accounts
    /// This is called after a successful subscription activation
    /// </summary>
    private async Task TriggerMemberActivationEmailsAsync(int clubId)
    {
        try
        {
            _logger.LogInformation("Triggering activation emails for existing members in club {ClubId} after upgrade to Grow tier", clubId);

            // Get all members in the club
            var members = await _context.Members
                .Where(m => m.ClubId == clubId)
                .ToListAsync();

            _logger.LogInformation("Found {MemberCount} existing members in club {ClubId}", members.Count, clubId);

            var activationEmailsSent = 0;
            var activationEmailsFailed = 0;

            foreach (var member in members)
            {
                try
                {
                    // Check if this member already has an active user account
                    var existingUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Email == member.Email);

                    // Skip if user already exists and is active
                    if (existingUser != null && existingUser.IsActive)
                    {
                        continue;
                    }

                    // Skip if user exists but is already pending activation (has valid activation token)
                    if (existingUser != null && !existingUser.IsActive &&
                        !string.IsNullOrEmpty(existingUser.ActivationToken) &&
                        existingUser.ActivationTokenExpiresAt.HasValue &&
                        existingUser.ActivationTokenExpiresAt.Value > DateTime.UtcNow)
                    {
                        continue;
                    }

                    // Trigger the activation email flow for this member
                    var emailSent = await _memberActivationService.CreateMemberAccountAndSendActivationEmailAsync(member.Id, clubId);

                    if (emailSent)
                    {
                        activationEmailsSent++;
                    }
                    else
                    {
                        activationEmailsFailed++;
                        _logger.LogWarning("Failed to send activation email for member {MemberId} ({Email})", member.Id, member.Email);
                    }
                }
                catch (Exception ex)
                {
                    activationEmailsFailed++;
                    _logger.LogError(ex, "Error sending activation email for member {MemberId} ({Email})", member.Id, member.Email);
                }
            }

            _logger.LogInformation("Activation email processing complete for club {ClubId}. Sent: {Sent}, Failed: {Failed}",
                clubId, activationEmailsSent, activationEmailsFailed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to trigger activation emails for club {ClubId} after upgrade", clubId);
            // Don't throw - we don't want to fail the upgrade process if emails fail
        }
    }

    /// <summary>
    /// Gets the member limit for a given tier
    /// </summary>
    private static int GetMemberLimitForTier(string tier)
    {
        return tier.ToLower() switch
        {
            "seed" => 100,
            "grow" => 200,
            "unlimited" or "expand" => 2000,
            _ => 200 // Default to Grow limits
        };
    }

    private static bool IsTopTier(string? tier)
    {
        return string.Equals(tier, "Expand", StringComparison.OrdinalIgnoreCase)
            || string.Equals(tier, "Unlimited", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetDisplayTierName(string? tier)
    {
        return IsTopTier(tier) ? "Expand" : tier ?? "Seed";
    }

    private static string NormalizeRequestedTierName(string tier)
    {
        if (string.IsNullOrWhiteSpace(tier))
        {
            return "Seed";
        }

        if (IsTopTier(tier))
        {
            return "Expand";
        }

        return char.ToUpperInvariant(tier[0]) + tier[1..].ToLowerInvariant();
    }

    /// <summary>
    /// Validates that the upgrade path is allowed
    /// </summary>
    private static void ValidateUpgradePath(string currentTier, string targetTier)
    {
        var validUpgrades = currentTier.ToLower() switch
        {
            "seed" => new[] { "seed", "grow", "expand", "unlimited" },
            "grow" => new[] { "grow", "expand", "unlimited" },
            "expand" or "unlimited" => Array.Empty<string>(),
            _ => new string[0]
        };

        if (!validUpgrades.Contains(targetTier.ToLower()))
        {
            throw new InvalidOperationException($"Cannot upgrade from {currentTier} to {targetTier}");
        }
    }

    /// <summary>
    /// Validates that the plan ID matches the expected tier and billing cycle
    /// </summary>
    private bool IsValidPlanId(string planId, string targetTier, string billingCycle)
    {
        return (targetTier.ToLower(), billingCycle.ToLower()) switch
        {
            ("seed", "monthly") => planId == _stripeSettings.SeedMonthlyPriceId,
            ("seed", "annual") => planId == _stripeSettings.SeedAnnualPriceId,
            ("grow", "monthly") => planId == _stripeSettings.GrowMonthlyPriceId,
            ("grow", "annual") => planId == _stripeSettings.GrowAnnualPriceId,
            ("expand", "monthly") or ("unlimited", "monthly") => planId == _stripeSettings.UnlimitedMonthlyPriceId,
            ("expand", "annual") or ("unlimited", "annual") => planId == _stripeSettings.UnlimitedAnnualPriceId,
            _ => false
        };
    }

    /// <summary>
    /// Gets the billing cycle from a Stripe subscription
    /// </summary>
    private async Task<string?> GetBillingCycleFromSubscriptionAsync(string? subscriptionId)
    {
        if (string.IsNullOrEmpty(subscriptionId))
        {
            return null;
        }

        try
        {
            var subscriptionService = new SubscriptionService();
            var subscription = await subscriptionService.GetAsync(subscriptionId);

            if (subscription?.Items?.Data?.Any() == true)
            {
                var firstItem = subscription.Items.Data.FirstOrDefault();
                if (firstItem?.Price?.Id == null)
                {
                    return null;
                }

                var priceId = firstItem.Price.Id;

                // Determine billing cycle based on price ID
                if (priceId == _stripeSettings.GrowAnnualPriceId ||
                    priceId == _stripeSettings.UnlimitedAnnualPriceId ||
                    priceId == _stripeSettings.SeedAnnualPriceId)
                {
                    return "annual";
                }
                else if (priceId == _stripeSettings.GrowMonthlyPriceId ||
                         priceId == _stripeSettings.UnlimitedMonthlyPriceId ||
                         priceId == _stripeSettings.SeedMonthlyPriceId)
                {
                    return "monthly";
                }
            }

            return null;
        }
        catch (StripeException ex)
        {
            // SECURITY FIX: Log Stripe billing cycle retrieval failures for audit trail
            _logger.LogError(ex, "Failed to retrieve billing cycle from Stripe for subscription {SubscriptionId}. " +
                "Error Code: {ErrorCode}, Error Type: {ErrorType}",
                subscriptionId, ex.StripeError?.Code, ex.StripeError?.Type);
            return null;
        }
    }

    /// <summary>
    /// Gets the tier name from a Stripe price ID
    /// </summary>
    private string GetTierFromPriceId(string priceId)
    {
        if (priceId == _stripeSettings.SeedMonthlyPriceId || priceId == _stripeSettings.SeedAnnualPriceId)
        {
            return "Seed";
        }
        else if (priceId == _stripeSettings.GrowMonthlyPriceId || priceId == _stripeSettings.GrowAnnualPriceId)
        {
            return "Grow";
        }
        else if (priceId == _stripeSettings.UnlimitedMonthlyPriceId || priceId == _stripeSettings.UnlimitedAnnualPriceId)
        {
            return "Expand";
        }

        return "Grow"; // Default fallback for backward compatibility
    }

    private static string NormalizeSubscriptionStatus(string? status)
    {
        return BillingAccessPolicy.NormalizeSubscriptionStatus(status);
    }

    private static string GetTrialStatus(Club club)
    {
        return BillingAccessPolicy.Evaluate(club, DateTime.UtcNow).TrialStatus;
    }

    private static bool IsAccountLocked(Club club)
    {
        return BillingAccessPolicy.Evaluate(club, DateTime.UtcNow).AccountLocked;
    }
}
