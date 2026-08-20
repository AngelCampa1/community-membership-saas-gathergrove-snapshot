using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Data;

/// <summary>
/// The main database context for GatherGrove application
/// </summary>
public class GatherGroveDbContext : DbContext
{
    public GatherGroveDbContext(DbContextOptions<GatherGroveDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Users in the system
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// Clubs in the system
    /// </summary>
    public DbSet<Club> Clubs { get; set; }

    /// <summary>
    /// Club administrators (many-to-many relationship between Users and Clubs)
    /// </summary>
    public DbSet<ClubAdmin> ClubAdmins { get; set; }

    /// <summary>
    /// Password reset tokens for secure password recovery
    /// </summary>
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    /// <summary>
    /// Membership types within clubs
    /// </summary>
    public DbSet<MembershipType> MembershipTypes { get; set; }

    /// <summary>
    /// Members of clubs
    /// </summary>
    public DbSet<Member> Members { get; set; }

    /// <summary>
    /// Club administrator invitations
    /// </summary>
    public DbSet<ClubAdminInvite> ClubAdminInvites { get; set; }

    /// <summary>
    /// Payments made by members for dues
    /// </summary>
    public DbSet<Payment> Payments { get; set; }

    /// <summary>
    /// Secure tokens for payment requests
    /// </summary>
    public DbSet<PaymentToken> PaymentTokens { get; set; }

    /// <summary>
    /// Email usage tracking for tier-based limitations
    /// </summary>
    public DbSet<ClubEmailUsage> ClubEmailUsage { get; set; }

    /// <summary>
    /// Logs of all communications sent to members
    /// </summary>
    public DbSet<CommunicationsLog> CommunicationsLogs { get; set; }

    /// <summary>
    /// Events organized by clubs
    /// </summary>
    public DbSet<Event> Events { get; set; }

    /// <summary>
    /// Event RSVPs from members
    /// </summary>
    public DbSet<EventRsvp> EventRsvps { get; set; }

    /// <summary>
    /// Event feedback from members
    /// </summary>
    public DbSet<EventFeedback> EventFeedbacks { get; set; }

    /// <summary>
    /// Event QR codes for check-in
    /// </summary>
    public DbSet<EventQRCode> EventQRCodes { get; set; }

    /// <summary>
    /// Member-specific QR codes for events
    /// </summary>
    public DbSet<MemberEventQRCode> MemberEventQRCodes { get; set; }

    /// <summary>
    /// QR code scans and usage tracking
    /// </summary>
    public DbSet<QRCodeScan> QRCodeScans { get; set; }

    /// <summary>
    /// Event check-in records
    /// </summary>
    public DbSet<EventCheckin> EventCheckins { get; set; }

    /// <summary>
    /// Event feedback surveys
    /// </summary>
    public DbSet<EventFeedbackSurvey> EventFeedbackSurveys { get; set; }

    /// <summary>
    /// Survey questions for feedback surveys
    /// </summary>
    public DbSet<SurveyQuestion> SurveyQuestions { get; set; }

    /// <summary>
    /// Event feedback responses to surveys
    /// </summary>
    public DbSet<EventFeedbackResponse> EventFeedbackResponses { get; set; }

    /// <summary>
    /// Individual responses to survey questions
    /// </summary>
    public DbSet<SurveyResponse> SurveyResponses { get; set; }

    /// <summary>
    /// RSVP tokens for secure email-based RSVP links
    /// </summary>
    public DbSet<RsvpToken> RsvpTokens { get; set; }

    /// <summary>
    /// Multi-session events (e.g., workshops, courses)
    /// </summary>
    public DbSet<MultiSessionEvent> MultiSessionEvents { get; set; }

    /// <summary>
    /// Individual sessions within multi-session events
    /// </summary>
    public DbSet<EventSession> EventSessions { get; set; }

    /// <summary>
    /// Registrations for multi-session events
    /// </summary>
    public DbSet<MultiSessionEventRegistration> MultiSessionEventRegistrations { get; set; }

    /// <summary>
    /// Individual session registrations
    /// </summary>
    public DbSet<EventSessionRegistration> EventSessionRegistrations { get; set; }

    /// <summary>
    /// Attendance tracking for event sessions
    /// </summary>
    public DbSet<EventSessionAttendance> EventSessionAttendances { get; set; }

    /// <summary>
    /// Recurring event series (e.g., weekly meetings, monthly socials)
    /// </summary>
    public DbSet<EventSeries> EventSeries { get; set; }

    /// <summary>
    /// Event waitlist entries for events at capacity
    /// </summary>
    public DbSet<EventWaitlist> EventWaitlists { get; set; }

    /// <summary>
    /// Club chat messages for group communication
    /// </summary>
    public DbSet<ClubChatMessage> ClubChatMessages { get; set; }

    /// <summary>
    /// Club branding settings for white-label customization
    /// </summary>
    public DbSet<ClubBranding> ClubBrandings { get; set; }

    /// <summary>
    /// Club alert configurations for engagement and churn alerts
    /// </summary>
    public DbSet<AlertConfiguration> AlertConfigurations { get; set; }

    /// <summary>
    /// Custom fields defined by club administrators for member profiles
    /// </summary>
    public DbSet<ClubCustomField> ClubCustomFields { get; set; }

    /// <summary>
    /// Custom field values for members
    /// </summary>
    public DbSet<MemberCustomFieldValue> MemberCustomFieldValues { get; set; }

    /// <summary>
    /// Device tokens for push notifications
    /// </summary>
    public DbSet<UserDeviceToken> UserDeviceTokens { get; set; }

    /// <summary>
    /// Member invite codes for self-service member registration
    /// </summary>
    public DbSet<MemberInviteCode> MemberInviteCodes { get; set; }

    /// <summary>
    /// Marketing leads captured from website
    /// </summary>
    public DbSet<MarketingLead> MarketingLeads { get; set; }

    /// <summary>
    /// Application feedback from users
    /// </summary>
    public DbSet<AppFeedback> AppFeedback { get; set; }

    /// <summary>
    /// Analytics sessions for tracking user behavior
    /// </summary>
    public DbSet<AnalyticsSession> AnalyticsSessions { get; set; }

    /// <summary>
    /// Analytics events for detailed tracking
    /// </summary>
    public DbSet<AnalyticsEvent> AnalyticsEvents { get; set; }

    /// <summary>
    /// Error logs for local development and debugging
    /// </summary>
    public DbSet<ErrorLog> ErrorLogs { get; set; }

    /// <summary>
    /// Member import operations for audit tracking
    /// </summary>
    public DbSet<MemberImport> MemberImports { get; set; }

    /// <summary>
    /// Member engagement scores for tracking activity levels
    /// </summary>
    public DbSet<MemberEngagementScore> MemberEngagementScores { get; set; }

    /// <summary>
    /// Feature usage events for analytics and engagement tracking
    /// </summary>
    public DbSet<FeatureUsageEvent> FeatureUsageEvents { get; set; }

    /// <summary>
    /// Member activity sessions for engagement pattern analysis
    /// </summary>
    public DbSet<MemberActivitySession> MemberActivitySessions { get; set; }

    /// <summary>
    /// Event attendance records for members
    /// </summary>
    public DbSet<EventAttendance> EventAttendances { get; set; }

    /// <summary>
    /// Member engagement history tracking
    /// </summary>
    public DbSet<MemberEngagementHistory> MemberEngagementHistories { get; set; }

    /// <summary>
    /// Member engagement alerts for admin notifications
    /// </summary>
    public DbSet<MemberEngagementAlert> MemberEngagementAlerts { get; set; }

    /// <summary>
    /// Member login tracking for engagement analytics
    /// </summary>
    public DbSet<MemberLoginTracking> MemberLoginTrackings { get; set; }

    /// <summary>
    /// Profile completeness tracking for members
    /// </summary>
    public DbSet<ProfileCompletenessTracking> ProfileCompletenessTrackings { get; set; }

    /// <summary>
    /// Event engagement tracking for comprehensive analytics
    /// </summary>
    public DbSet<EventEngagementTracking> EventEngagementTrackings { get; set; }

    /// <summary>
    /// Event analytics metrics for aggregate data
    /// </summary>
    public DbSet<EventAnalyticsMetrics> EventAnalyticsMetrics { get; set; }

    /// <summary>
    /// Configurable scoring rules for event engagement
    /// </summary>
    public DbSet<EventEngagementScoringRules> EventEngagementScoringRules { get; set; }

    /// <summary>
    /// AI-driven event recommendations
    /// </summary>
    public DbSet<EventRecommendations> EventRecommendations { get; set; }

    /// <summary>
    /// Event engagement trend analysis
    /// </summary>
    public DbSet<EventEngagementTrends> EventEngagementTrends { get; set; }

    /// <summary>
    /// Member-level event engagement scores
    /// </summary>
    public DbSet<MemberEventEngagementScores> MemberEventEngagementScores { get; set; }

    /// <summary>
    /// Event feedback and sentiment analysis
    /// </summary>
    public DbSet<EventFeedbackAnalysis> EventFeedbackAnalyses { get; set; }

    /// <summary>
    /// Scheduled reports for automated report generation
    /// </summary>
    public DbSet<ScheduledReport> ScheduledReports { get; set; }

    /// <summary>
    /// Report execution history tracking
    /// </summary>
    public DbSet<ReportExecutionHistory> ReportExecutionHistories { get; set; }

    #region Member Segmentation DbSets

    /// <summary>
    /// Custom fields for member profiles defined by clubs
    /// </summary>
    public DbSet<MemberCustomField> MemberCustomFields { get; set; }

    /// <summary>
    /// Tags that can be assigned to members
    /// </summary>
    public DbSet<MemberTag> MemberTags { get; set; }

    /// <summary>
    /// Tag assignments to members
    /// </summary>
    public DbSet<MemberTagAssignment> MemberTagAssignments { get; set; }

    /// <summary>
    /// Dynamic member segments based on criteria
    /// </summary>
    public DbSet<MemberSegment> MemberSegments { get; set; }

    /// <summary>
    /// Relationship between segments and members
    /// </summary>
    public DbSet<SegmentMember> SegmentMembers { get; set; }

    /// <summary>
    /// Rules for member segment filtering
    /// </summary>
    // public DbSet<MemberSegmentRule> MemberSegmentRules { get; set; }

    /// <summary>
    /// Cached member segment assignments for performance
    /// </summary>
    public DbSet<MemberSegmentCache> MemberSegmentCaches { get; set; }

    /// <summary>
    /// History of member segment calculations
    /// </summary>
    public DbSet<MemberSegmentHistory> MemberSegmentHistories { get; set; }

    /// <summary>
    /// Bulk operations on members
    /// </summary>
    // public DbSet<BulkOperation> BulkOperations { get; set; }

    /// <summary>
    /// Individual items within bulk operations
    /// </summary>
    // public DbSet<BulkOperationItem> BulkOperationItems { get; set; }

    /// <summary>
    /// Analytics data for member segments
    /// </summary>
    // public DbSet<SegmentAnalytics> SegmentAnalytics { get; set; }

    /// <summary>
    /// Performance metrics for member segments
    /// </summary>
    // public DbSet<SegmentPerformanceMetric> SegmentPerformanceMetrics { get; set; }

    /// <summary>
    /// Filter templates for segment creation
    /// </summary>
    public DbSet<SegmentFilterTemplate> SegmentFilterTemplates { get; set; }

    #endregion

    #region Advanced Communications

    /// <summary>
    /// Email templates for club communications
    /// </summary>
    public DbSet<EmailTemplate> EmailTemplates { get; set; }

    /// <summary>
    /// A/B test campaigns for communications
    /// </summary>
    public DbSet<ABTestCampaign> ABTestCampaigns { get; set; }

    /// <summary>
    /// Communication workflows for automation
    /// </summary>
    public DbSet<CommunicationWorkflow> CommunicationWorkflows { get; set; }

    /// <summary>
    /// Analytics tracking for communications
    /// </summary>
    public DbSet<CommunicationAnalytics> CommunicationAnalytics { get; set; }

    /// <summary>
    /// Custom personalization tokens for communications
    /// </summary>
    public DbSet<PersonalizationToken> PersonalizationTokens { get; set; }

    #endregion

    #region Multi-Location Support

    /// <summary>
    /// Club locations/chapters for multi-location management
    /// </summary>
    public DbSet<ClubLocation> ClubLocations { get; set; }

    /// <summary>
    /// Location administrators with hierarchical permissions
    /// </summary>
    public DbSet<LocationAdmin> LocationAdmins { get; set; }

    /// <summary>
    /// Member transfer requests between locations
    /// </summary>
    public DbSet<MemberTransfer> MemberTransfers { get; set; }

    /// <summary>
    /// Location-specific branding and customization
    /// </summary>
    public DbSet<LocationBranding> LocationBrandings { get; set; }

    /// <summary>
    /// External OAuth providers (Google, Apple) linked to user accounts
    /// </summary>
    public DbSet<ExternalAuthProvider> ExternalAuthProviders { get; set; }

    #endregion

    #region Billing and Promotions

    /// <summary>
    /// Promotional offers that can be applied to subscriptions
    /// </summary>
    public DbSet<Promotion> Promotions { get; set; }

    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ActivationToken).HasMaxLength(255);
            entity.Property(e => e.ActivationTokenExpiresAt);
            entity.Property(e => e.OnboardingCompleted).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Unique constraint on email
            entity.HasIndex(e => e.Email).IsUnique();

            // Index on activation token for fast lookups
            entity.HasIndex(e => e.ActivationToken);
        });

        // ExternalAuthProvider entity configuration
        modelBuilder.Entity<ExternalAuthProvider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ProviderUserId).IsRequired().HasMaxLength(256);
            entity.Property(e => e.ProviderEmail).HasMaxLength(256);
            entity.Property(e => e.EmailVerifiedAtLinking).IsRequired();
            entity.Property(e => e.LinkedAt).IsRequired();
            entity.Property(e => e.LastUsedAt).IsRequired();

            // Relationship with User
            entity.HasOne(e => e.User)
                  .WithMany(u => u.ExternalAuthProviders)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: One provider account can only be linked to one user
            entity.HasIndex(e => new { e.Provider, e.ProviderUserId }).IsUnique();

            // Index for user lookup
            entity.HasIndex(e => e.UserId);
        });

        // Club entity configuration
        modelBuilder.Entity<Club>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Tier).IsRequired().HasMaxLength(50).HasDefaultValue("Grow");
            entity.Property(e => e.TrialExpiresAt);
            entity.Property(e => e.StripeCustomerId).HasMaxLength(255);
            entity.Property(e => e.StripeSubscriptionId).HasMaxLength(255);
            entity.Property(e => e.SubscriptionStatus).HasMaxLength(50);
            entity.Property(e => e.StripeAccountId).HasMaxLength(255);
            entity.Property(e => e.IsDirectoryEnabled).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DirectoryAllowedSharableFields).HasMaxLength(1000);
            entity.Property(e => e.CreatedByUserId).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship for CreatedByUserId
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Index on Stripe customer ID for faster lookups
            entity.HasIndex(e => e.StripeCustomerId);
            entity.HasIndex(e => e.StripeSubscriptionId);
            entity.HasIndex(e => e.StripeAccountId);
            entity.HasIndex(e => e.TrialExpiresAt);

            // Relationship with Promotion
            entity.HasOne(e => e.AppliedPromotion)
                .WithMany(p => p.AppliedToClubs)
                .HasForeignKey(e => e.AppliedPromotionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.AppliedPromotionId);
        });

        // Promotion entity configuration
        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.PromotionId);
            entity.Property(e => e.PromotionId).ValueGeneratedOnAdd();
            entity.Property(e => e.StripeCouponId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.StripePromotionCodeId).HasMaxLength(255);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.PromoCode).HasMaxLength(50);
            entity.Property(e => e.IsAutoApply).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.MaxAutoApplyRedemptions);
            entity.Property(e => e.AutoApplyRedemptionCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.StartsAt);
            entity.Property(e => e.ExpiresAt);
            entity.Property(e => e.DiscountType).HasMaxLength(50);
            entity.Property(e => e.PercentOff).HasColumnType("decimal(5,2)");
            entity.Property(e => e.AmountOff);
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.Duration).HasMaxLength(50);
            entity.Property(e => e.DurationInMonths);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt);

            // Index on Stripe coupon ID for fast lookups
            entity.HasIndex(e => e.StripeCouponId);

            // Index on promo code for code lookups (case-insensitive handled in service)
            entity.HasIndex(e => e.PromoCode);

            // Index for finding active auto-apply promotions
            entity.HasIndex(e => new { e.IsActive, e.IsAutoApply });
        });

        // ClubAdmin entity configuration
        modelBuilder.Entity<ClubAdmin>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.User)
                  .WithMany(u => u.ClubAdmins)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Club)
                  .WithMany(c => c.ClubAdmins)
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint to prevent duplicate admin relationships
            entity.HasIndex(e => new { e.UserId, e.ClubId }).IsUnique();
        });

        // PasswordResetToken entity configuration
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsUsed).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index on TokenHash for faster lookups
            entity.HasIndex(e => e.TokenHash);
            // Index on ExpiresAt for cleanup queries
            entity.HasIndex(e => e.ExpiresAt);
        });

        // MembershipType entity configuration
        modelBuilder.Entity<MembershipType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DuesAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.DuesFrequency).IsRequired().HasMaxLength(50).HasDefaultValue("Monthly");
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany(c => c.MembershipTypes)
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on name within a club
            entity.HasIndex(e => new { e.ClubId, e.Name }).IsUnique();
        });

        // Member entity configuration
        modelBuilder.Entity<Member>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.MembershipTypeId).IsRequired();
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");
            entity.Property(e => e.JoinDate).IsRequired();
            entity.Property(e => e.DuesPaidUntil);
            entity.Property(e => e.HasSmsConsent).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsListedInDirectory).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DirectoryVisibleFields).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.InviteCodeId);

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany(c => c.Members)
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.MembershipType)
                  .WithMany(mt => mt.Members)
                  .HasForeignKey(e => e.MembershipTypeId)
                  .OnDelete(DeleteBehavior.Restrict); // Prevent deletion of membership types with members

            entity.HasOne(e => e.InviteCode)
                  .WithMany(ic => ic.Members)
                  .HasForeignKey(e => e.InviteCodeId)
                  .OnDelete(DeleteBehavior.NoAction); // Keep member record if invite code is deleted

            // Unique constraint on email within a club
            entity.HasIndex(e => new { e.ClubId, e.Email }).IsUnique();
        });

        // ClubAdminInvite entity configuration
        modelBuilder.Entity<ClubAdminInvite>(entity =>
        {
            entity.HasKey(e => e.InviteId);
            entity.Property(e => e.InviteId).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.InviteToken).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.InvitedByUserId).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.InvitedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.InvitedByUserId)
                  .OnDelete(DeleteBehavior.Restrict); // Don't delete invites when user is deleted

            // Unique constraint on token
            entity.HasIndex(e => e.InviteToken).IsUnique();

            // Index on email and club for faster lookups
            entity.HasIndex(e => new { e.ClubId, e.Email });
            // Index on ExpiresAt for cleanup queries
            entity.HasIndex(e => e.ExpiresAt);
        });

        // Payment entity configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.PaymentId).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Amount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaymentDate).IsRequired();
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany(m => m.Payments)
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index on member and club for faster lookups
            entity.HasIndex(e => new { e.ClubId, e.MemberId });
            entity.HasIndex(e => e.PaymentDate);
        });

        // PaymentToken entity configuration
        modelBuilder.Entity<PaymentToken>(entity =>
        {
            entity.HasKey(e => e.PaymentTokenId);
            entity.Property(e => e.PaymentTokenId).ValueGeneratedOnAdd();
            entity.Property(e => e.Token).IsRequired().HasMaxLength(255);
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Amount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsUsed).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => new { e.ClubId, e.MemberId });
            entity.HasIndex(e => e.ExpiresAt);
        });

        // ClubEmailUsage entity configuration
        modelBuilder.Entity<ClubEmailUsage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.UsageMonth).IsRequired();
            entity.Property(e => e.AdminEmailsSentCount).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on club and month to prevent duplicates
            entity.HasIndex(e => new { e.ClubId, e.UsageMonth }).IsUnique();
        });

        // CommunicationsLog entity configuration
        modelBuilder.Entity<CommunicationsLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.CommunicationType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Subject).HasMaxLength(500);
            entity.Property(e => e.Body).IsRequired();
            entity.Property(e => e.RecipientCount).IsRequired();
            entity.Property(e => e.Recipients).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(e => e.SentByUserId).IsRequired();
            entity.Property(e => e.SentAt).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.SentByUser)
                  .WithMany()
                  .HasForeignKey(e => e.SentByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.SentAt });
            entity.HasIndex(e => e.CommunicationType);
        });

        // Event entity configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EventDateTime).IsRequired();
            entity.Property(e => e.Location).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(5000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Decimal precision configuration for price fields
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MemberPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.NonMemberPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.EarlyBirdPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.GroupDiscountPercentage).HasColumnType("decimal(5,2)");

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany(c => c.Events)
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index on club and event date for faster lookups
            entity.HasIndex(e => new { e.ClubId, e.EventDateTime });
        });

        // EventRsvp entity configuration
        modelBuilder.Entity<EventRsvp>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.RsvpStatus).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Decimal precision configuration for PaidAmount
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany(e => e.EventRsvps)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany(m => m.EventRsvps)
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.NoAction);

            // Unique constraint to prevent duplicate RSVPs for the same member and event
            entity.HasIndex(e => new { e.EventId, e.MemberId }).IsUnique();

            // Index for performance
            entity.HasIndex(e => e.RsvpStatus);
        });

        // RsvpToken entity configuration
        modelBuilder.Entity<RsvpToken>(entity =>
        {
            entity.HasKey(e => e.RsvpTokenId);
            entity.Property(e => e.RsvpTokenId).ValueGeneratedOnAdd();
            entity.Property(e => e.TokenValue).IsRequired().HasMaxLength(255);
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.IntendedRsvpStatus).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsUsed).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on token value
            entity.HasIndex(e => e.TokenValue).IsUnique();

            // Index on member and event for faster lookups
            entity.HasIndex(e => new { e.MemberId, e.EventId });

            // Index on expiry for cleanup queries
            entity.HasIndex(e => e.ExpiresAt);
        });

        // ClubChatMessage entity configuration
        modelBuilder.Entity<ClubChatMessage>(entity =>
        {
            entity.HasKey(e => e.ChatMessageId);
            entity.Property(e => e.ChatMessageId).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.SenderUserId).IsRequired();
            entity.Property(e => e.MessageContent).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.SentAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.SenderUser)
                  .WithMany()
                  .HasForeignKey(e => e.SenderUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.SentAt });
            entity.HasIndex(e => e.SenderUserId);
        });

        // ClubCustomField entity configuration
        modelBuilder.Entity<ClubCustomField>(entity =>
        {
            entity.HasKey(e => e.CustomFieldId);
            entity.Property(e => e.CustomFieldId).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.FieldLabel).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FieldType).IsRequired().HasMaxLength(50).HasDefaultValue("Text");
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on field label within a club to prevent duplicates
            entity.HasIndex(e => new { e.ClubId, e.FieldLabel }).IsUnique();

            // Index for performance
            entity.HasIndex(e => e.ClubId);
        });

        // MemberCustomFieldValue entity configuration
        modelBuilder.Entity<MemberCustomFieldValue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.CustomFieldId).IsRequired();
            entity.Property(e => e.Value).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany(m => m.CustomFieldValues)
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CustomField)
                  .WithMany()
                  .HasForeignKey(e => e.CustomFieldId)
                  .OnDelete(DeleteBehavior.Restrict); // Changed to Restrict to avoid cascade cycles

            // Unique constraint to prevent duplicate values for the same member and custom field
            entity.HasIndex(e => new { e.MemberId, e.CustomFieldId }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.CustomFieldId);
        });

        // UserDeviceToken entity configuration
        modelBuilder.Entity<UserDeviceToken>(entity =>
        {
            entity.HasKey(e => e.UserDeviceTokenId);
            entity.Property(e => e.UserDeviceTokenId).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.DeviceToken).IsRequired();
            entity.Property(e => e.DeviceType).IsRequired().HasMaxLength(10);
            entity.Property(e => e.LastLogin).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint to prevent duplicate device tokens for the same user
            entity.HasIndex(e => new { e.UserId, e.DeviceToken }).IsUnique();

            // Index for performance
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DeviceType);
        });

        // MemberInviteCode entity configuration
        modelBuilder.Entity<MemberInviteCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.MembershipTypeId).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.MaxUses);
            entity.Property(e => e.CurrentUses).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.CreatedByUserId).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.MembershipType)
                  .WithMany()
                  .HasForeignKey(e => e.MembershipTypeId)
                  .OnDelete(DeleteBehavior.Restrict); // Prevent deletion of membership types with active invite codes

            entity.HasOne(e => e.CreatedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict); // Keep invite codes if admin user is deleted

            // Unique constraint on code to prevent duplicates
            entity.HasIndex(e => e.Code).IsUnique();

            // Index for performance
            entity.HasIndex(e => e.ClubId);
            entity.HasIndex(e => new { e.ClubId, e.IsActive });
            entity.HasIndex(e => e.ExpiresAt);
        });

        // MarketingLead entity configuration
        modelBuilder.Entity<MarketingLead>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(254);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Source).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Variant).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.ReferrerUrl).HasMaxLength(1000);
            entity.Property(e => e.CurrentUrl).HasMaxLength(1000);
            entity.Property(e => e.SessionId).HasMaxLength(128);
            entity.Property(e => e.Metadata); // JSON metadata field
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsContacted).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ContactedAt); // Optional timestamp
            entity.Property(e => e.IsConverted).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ConvertedAt); // Optional timestamp
            entity.Property(e => e.HasConsent).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.ConsentWithdrawnAt); // Optional timestamp

            // Indexes for performance
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Source);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Source, e.CreatedAt });
            entity.HasIndex(e => new { e.Email, e.Source }).IsUnique();
            entity.HasIndex(e => e.IsContacted);
            entity.HasIndex(e => e.IsConverted);
        });

        // MemberImport entity configuration
        modelBuilder.Entity<MemberImport>(entity =>
        {
            entity.HasKey(e => e.ImportId);
            entity.Property(e => e.ImportId).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.TotalRows).IsRequired();
            entity.Property(e => e.SuccessfulRows).IsRequired();
            entity.Property(e => e.FailedRows).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ErrorReport);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.CompletedAt);

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Index for performance
            entity.HasIndex(e => new { e.ClubId, e.CreatedAt });
        });

        // MemberEngagementScore entity configuration
        modelBuilder.Entity<MemberEngagementScore>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.OverallScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.LoginScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.EventScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.CommunicationScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.FeatureUsageScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.ProfileCompletenessScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.CalculatedDate).IsRequired();
            entity.Property(e => e.EngagementLevel).IsRequired().HasMaxLength(20);

            // Decimal precision configuration for AverageSessionDurationMinutes
            entity.Property(e => e.AverageSessionDurationMinutes).HasColumnType("decimal(18,2)");

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint to ensure one score per member per club
            entity.HasIndex(e => new { e.MemberId, e.ClubId }).IsUnique();

            // Index for performance queries
            entity.HasIndex(e => new { e.ClubId, e.CalculatedDate });
            entity.HasIndex(e => e.EngagementLevel);
            entity.HasIndex(e => e.OverallScore);
        });

        // FeatureUsageEvent entity configuration
        modelBuilder.Entity<FeatureUsageEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.FeatureName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Platform).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SessionId).HasMaxLength(128);
            entity.Property(e => e.UsedAt).IsRequired();
            entity.Property(e => e.Metadata); // JSON column
            entity.Property(e => e.MemberTenure).IsRequired();
            entity.Property(e => e.EngagementWeight).IsRequired().HasColumnType("decimal(3,1)").HasDefaultValue(1.0m);

            // Decimal precision configuration for Duration (in seconds)
            entity.Property(e => e.Duration).HasColumnType("decimal(18,2)");

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.UsedAt });
            entity.HasIndex(e => new { e.MemberId, e.UsedAt });
            entity.HasIndex(e => e.FeatureName);
            entity.HasIndex(e => e.Platform);
        });

        // MemberActivitySession entity configuration
        modelBuilder.Entity<MemberActivitySession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.SessionId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.EndTime);
            entity.Property(e => e.DurationMinutes);
            entity.Property(e => e.PageViews).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.ActionsPerformed).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.MessagesSent).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.EventInteractions).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.Platform).IsRequired().HasMaxLength(20).HasDefaultValue("web");
            entity.Property(e => e.DeviceType).HasMaxLength(20);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.ReferrerUrl).HasMaxLength(500);
            entity.Property(e => e.QualityScore).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on session ID
            entity.HasIndex(e => e.SessionId).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => new { e.MemberId, e.StartTime });
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.QualityScore);
        });

        // EventAttendance entity configuration
        modelBuilder.Entity<EventAttendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.AttendedAt).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany(e => e.EventAttendances)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany(m => m.EventAttendances)
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => new { e.EventId, e.MemberId }).IsUnique();
            entity.HasIndex(e => e.AttendedAt);
        });

        // EventCheckin entity configuration
        modelBuilder.Entity<EventCheckin>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.CheckinTime).IsRequired();
            entity.Property(e => e.CheckinMethod).IsRequired();
            entity.Property(e => e.CheckinLocation).HasMaxLength(200);
            entity.Property(e => e.QRCodeToken).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            // Foreign key relationships - RESTRICT on Member to avoid cascade cycle
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict); // Changed from Cascade to prevent cycle

            // Indexes for performance
            entity.HasIndex(e => e.EventId);
            entity.HasIndex(e => e.MemberId);
        });

        // MemberEngagementHistory entity configuration
        modelBuilder.Entity<MemberEngagementHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.OverallScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.LoginFrequencyScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.EventParticipationScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.CommunicationScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.FeatureUsageScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.ProfileCompletenessScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.Level).IsRequired();
            entity.Property(e => e.RecordedAt).IsRequired();
            entity.Property(e => e.MetricsSnapshot).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => new { e.MemberId, e.RecordedAt });
            entity.HasIndex(e => e.Level);
        });

        // MemberEngagementAlert entity configuration
        modelBuilder.Entity<MemberEngagementAlert>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Severity).IsRequired();
            entity.Property(e => e.TriggerScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.PreviousScore).HasColumnType("decimal(5,2)");
            entity.Property(e => e.ScoreChange).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
            entity.Property(e => e.RecommendedActions).HasMaxLength(1000);
            entity.Property(e => e.IsResolved).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ResolvedAt);
            entity.Property(e => e.ResolvedByUserId);
            entity.Property(e => e.ResolutionNotes).HasMaxLength(1000);
            entity.Property(e => e.NotificationsSent).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.LastNotificationSent);

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ResolvedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ResolvedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Indexes for performance
            entity.HasIndex(e => new { e.MemberId, e.IsResolved });
            entity.HasIndex(e => e.Severity);
            entity.HasIndex(e => e.CreatedAt);
        });

        // MemberLoginTracking entity configuration
        modelBuilder.Entity<MemberLoginTracking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.LoginTimestamp).IsRequired();
            entity.Property(e => e.SessionId).IsRequired().HasMaxLength(128);
            entity.Property(e => e.SessionDuration);
            entity.Property(e => e.Platform).IsRequired().HasMaxLength(20).HasDefaultValue("web");
            entity.Property(e => e.DeviceType).HasMaxLength(20);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.LocationCode).HasMaxLength(10);
            entity.Property(e => e.IsSuccessful).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => new { e.MemberId, e.LoginTimestamp });
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.Platform);
        });

        // ProfileCompletenessTracking entity configuration
        modelBuilder.Entity<ProfileCompletenessTracking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.CompletionPercentage).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.RequiredFieldsTotal).IsRequired();
            entity.Property(e => e.RequiredFieldsCompleted).IsRequired();
            entity.Property(e => e.OptionalFieldsTotal).IsRequired();
            entity.Property(e => e.OptionalFieldsCompleted).IsRequired();
            entity.Property(e => e.IncompleteFields).IsRequired().HasDefaultValue("[]");
            entity.Property(e => e.RecentlyCompletedFields).IsRequired().HasDefaultValue("[]");
            entity.Property(e => e.CalculatedAt).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.CompletionPercentage);
            entity.HasIndex(e => e.CalculatedAt);
        });

        // EventEngagementTracking entity configuration
        modelBuilder.Entity<EventEngagementTracking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();

            entity.Property(e => e.RegistrationStatus).IsRequired().HasMaxLength(20).HasDefaultValue("registered");
            entity.Property(e => e.AttendanceStatus).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.AttendancePercentage).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);

            entity.Property(e => e.ParticipationLevel).IsRequired().HasMaxLength(20).HasDefaultValue("passive");
            entity.Property(e => e.ParticipationScore).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.Platform).IsRequired().HasMaxLength(20).HasDefaultValue("web");
            entity.Property(e => e.EngagementBoost).IsRequired().HasColumnType("decimal(6,2)").HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint for one record per member per event
            entity.HasIndex(e => new { e.EventId, e.MemberId }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => new { e.EventId, e.AttendanceStatus });
            entity.HasIndex(e => new { e.MemberId, e.ParticipationScore });
            entity.HasIndex(e => e.ParticipationLevel);
            entity.HasIndex(e => e.CreatedAt);
        });

        // EventAnalyticsMetrics entity configuration
        modelBuilder.Entity<EventAnalyticsMetrics>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.ClubId).IsRequired();

            entity.Property(e => e.AttendanceRate).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.AverageParticipationScore).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.EventSuccessScore).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.RevenueGenerated).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint for one record per event
            entity.HasIndex(e => e.EventId).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.CalculatedAt });
            entity.HasIndex(e => e.EventSuccessScore);
            entity.HasIndex(e => e.AttendanceRate);
        });

        // EventEngagementScoringRules entity configuration
        modelBuilder.Entity<EventEngagementScoringRules>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.RuleName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.EventType).HasMaxLength(50);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.Priority).IsRequired().HasDefaultValue(1);

            entity.Property(e => e.AttendanceWeight).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(30.0);
            entity.Property(e => e.ParticipationWeight).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(25.0);
            entity.Property(e => e.InteractionWeight).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(20.0);
            entity.Property(e => e.SatisfactionWeight).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(15.0);
            entity.Property(e => e.NetworkingWeight).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(10.0);

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.EventType, e.IsActive });
            entity.HasIndex(e => e.Priority).IsDescending();
        });

        // EventRecommendations entity configuration
        modelBuilder.Entity<EventRecommendations>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.EventId).IsRequired();

            entity.Property(e => e.RecommendationScore).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.ConfidenceLevel).IsRequired().HasColumnType("decimal(5,2)");
            entity.Property(e => e.RecommendationFactors).IsRequired().HasDefaultValue("{}");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("active");
            entity.Property(e => e.RecommendationMethod).IsRequired().HasMaxLength(50).HasDefaultValue("algorithm_v1");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => new { e.MemberId, e.RecommendationScore, e.Status }).IsDescending();
            entity.HasIndex(e => new { e.Status, e.CreatedAt });
            entity.HasIndex(e => e.ExpiresAt);
        });

        // EventEngagementTrends entity configuration
        modelBuilder.Entity<EventEngagementTrends>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.TrendPeriod).IsRequired().HasMaxLength(20);
            entity.Property(e => e.PeriodStart).IsRequired();
            entity.Property(e => e.PeriodEnd).IsRequired();
            entity.Property(e => e.TrendDirection).IsRequired().HasMaxLength(10).HasDefaultValue("stable");
            entity.Property(e => e.TrendInsights).IsRequired().HasDefaultValue("{}");
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint for one record per club per period
            entity.HasIndex(e => new { e.ClubId, e.TrendPeriod, e.PeriodStart }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => new { e.ClubId, e.TrendPeriod, e.PeriodStart });
            entity.HasIndex(e => e.TrendDirection);
        });

        // MemberEventEngagementScores entity configuration
        modelBuilder.Entity<MemberEventEngagementScores>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();

            entity.Property(e => e.EventAttendanceRate).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.AverageEventEngagementScore).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.PreferredEventTypes).IsRequired().HasDefaultValue("[]");
            entity.Property(e => e.EngagementTrend).IsRequired().HasMaxLength(10).HasDefaultValue("stable");
            entity.Property(e => e.RiskLevel).IsRequired().HasMaxLength(10).HasDefaultValue("low");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Member)
                  .WithOne(m => m.MemberEngagementScore)
                  .HasForeignKey<MemberEventEngagementScores>(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint for one record per member
            entity.HasIndex(e => e.MemberId).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => e.AverageEventEngagementScore);
            entity.HasIndex(e => e.RiskLevel);
            entity.HasIndex(e => e.EngagementTrend);
        });

        // EventFeedbackAnalysis entity configuration
        modelBuilder.Entity<EventFeedbackAnalysis>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();

            entity.Property(e => e.OverallSatisfaction).IsRequired().HasColumnType("decimal(3,1)");
            entity.Property(e => e.NetPromoterScore).IsRequired();
            entity.Property(e => e.KeyTopics).IsRequired().HasDefaultValue("[]");
            entity.Property(e => e.ResponseCompleteness).IsRequired().HasColumnType("decimal(5,2)").HasDefaultValue(100.0);
            entity.Property(e => e.ResponseDate).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint for one feedback per member per event
            entity.HasIndex(e => new { e.EventId, e.MemberId }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => new { e.EventId, e.OverallSatisfaction });
            entity.HasIndex(e => e.NetPromoterScore);
            entity.HasIndex(e => e.ResponseDate);
        });

        // ClubBranding entity configuration
        modelBuilder.Entity<ClubBranding>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.PrimaryColor).HasMaxLength(7);
            entity.Property(e => e.SecondaryColor).HasMaxLength(7);
            entity.Property(e => e.FontFamily).HasMaxLength(100);
            entity.Property(e => e.CustomCSS).HasMaxLength(10000);
            entity.Property(e => e.WhiteLabelDomain).HasMaxLength(255);
            entity.Property(e => e.FacebookUrl).HasMaxLength(500);
            entity.Property(e => e.TwitterUrl).HasMaxLength(500);
            entity.Property(e => e.InstagramUrl).HasMaxLength(500);
            entity.Property(e => e.LinkedInUrl).HasMaxLength(500);
            entity.Property(e => e.YouTubeUrl).HasMaxLength(500);
            entity.Property(e => e.WebsiteUrl).HasMaxLength(500);
            entity.Property(e => e.HideGatherGroveBranding).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CustomFooterText).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithOne()
                  .HasForeignKey<ClubBranding>(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint to ensure one branding per club
            entity.HasIndex(e => e.ClubId).IsUnique();

            // Index on domain for white-label lookup
            entity.HasIndex(e => e.WhiteLabelDomain);
        });

        // ScheduledReport entity configuration
        modelBuilder.Entity<ScheduledReport>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ClubId).IsRequired();
            entity.Property(e => e.ReportName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ReportType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Format).IsRequired();
            entity.Property(e => e.Frequency).IsRequired();
            entity.Property(e => e.WeeklyDayOfWeek);
            entity.Property(e => e.MonthlyDayOfMonth);
            entity.Property(e => e.DeliveryTime).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.NextRunDate).IsRequired();
            entity.Property(e => e.LastExecuted);
            entity.Property(e => e.CreatedByUserId).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.IncludeCharts).IsRequired().HasDefaultValue(false);

            // Configure CustomFilters as owned entity (JSON column)
            entity.OwnsOne(e => e.CustomFilters, customFilters =>
            {
                customFilters.ToJson();
            });

            // Configure Recipients list as JSON
            entity.Property(e => e.Recipients)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions)null) ?? new List<string>());

            // Foreign key relationship
            entity.HasOne(e => e.Club)
                  .WithMany()
                  .HasForeignKey(e => e.ClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.ClubId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.NextRunDate);
            entity.HasIndex(e => new { e.ClubId, e.IsActive });
        });

        // ReportExecutionHistory entity configuration  
        modelBuilder.Entity<ReportExecutionHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ScheduleId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ExecutedAt).IsRequired();
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.CompletedAt);
            entity.Property(e => e.ReportSizeBytes);
            entity.Property(e => e.ExecutionTimeSeconds).IsRequired();
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            entity.Property(e => e.JobId).HasMaxLength(50);
            entity.Property(e => e.ReportFilePath).HasMaxLength(500);

            // Foreign key relationship
            entity.HasOne(e => e.ScheduledReport)
                  .WithMany(sr => sr.ExecutionHistory)
                  .HasForeignKey(e => e.ScheduleId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.ScheduleId);
            entity.HasIndex(e => e.ExecutedAt);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.ScheduleId, e.ExecutedAt });
        });

        // SegmentMember entity configuration - Bridge table for many-to-many relationship
        modelBuilder.Entity<SegmentMember>(entity =>
        {
            // Composite primary key using SegmentId and MemberId
            entity.HasKey(e => new { e.SegmentId, e.MemberId });

            entity.Property(e => e.SegmentId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.AddedAt).IsRequired();
            entity.Property(e => e.AddedBy);

            // Foreign key relationships
            entity.HasOne(e => e.Segment)
                  .WithMany()
                  .HasForeignKey(e => e.SegmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AddedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.AddedBy)
                  .OnDelete(DeleteBehavior.SetNull);

            // Indexes for performance
            entity.HasIndex(e => e.SegmentId);
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.AddedAt);
        });

        // EventQRCode entity configuration
        modelBuilder.Entity<EventQRCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.QRCodeToken).IsRequired().HasMaxLength(100);
            entity.Property(e => e.QRCodeType).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.AllowMultipleScans).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.RequireRSVP).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship with Event
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.EventId);
            entity.HasIndex(e => e.QRCodeToken).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.IsActive);
        });

        // MemberEventQRCode entity configuration
        modelBuilder.Entity<MemberEventQRCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.QRCodeToken).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();

            // Configure CustomData as JSON column with proper handling
            entity.Property(e => e.CustomData)
                  .HasConversion(
                      v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                      v => string.IsNullOrEmpty(v) ? null : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null))
                  .HasColumnType("TEXT")
                  .IsRequired(false);

            // Foreign key relationships
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.EventId);
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.QRCodeToken).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.EventId, e.MemberId }).IsUnique();
        });

        // QRCodeScan entity configuration
        modelBuilder.Entity<QRCodeScan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ScannedAt).IsRequired();
            entity.Property(e => e.ScanLocation).HasMaxLength(200);
            entity.Property(e => e.ScanMethod).HasMaxLength(100);
            entity.Property(e => e.IsSuccessful).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.ErrorMessage).HasMaxLength(500);

            // Foreign key relationships
            entity.HasOne(e => e.QRCode)
                  .WithMany(q => q.Scans)
                  .HasForeignKey(e => e.QRCodeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.QRCodeId);
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.ScannedAt);
            entity.HasIndex(e => e.IsSuccessful);
        });

        // ClubLocation entity configuration
        modelBuilder.Entity<ClubLocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ParentClubId).IsRequired();
            entity.Property(e => e.LocationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.LocationCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Timezone).HasMaxLength(100);
            entity.Property(e => e.ContactEmail).HasMaxLength(255);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.SettingsJson).HasColumnType("TEXT");

            // Foreign key relationship with Club
            entity.HasOne(e => e.ParentClub)
                  .WithMany()
                  .HasForeignKey(e => e.ParentClubId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint on LocationCode per club
            entity.HasIndex(e => new { e.ParentClubId, e.LocationCode }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => e.ParentClubId);
            entity.HasIndex(e => e.IsActive);
        });

        // LocationAdmin entity configuration
        modelBuilder.Entity<LocationAdmin>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.LocationId).IsRequired();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.PermissionLevel).IsRequired();
            entity.Property(e => e.AssignedAt).IsRequired();
            entity.Property(e => e.AssignedBy);

            // Foreign key relationships
            entity.HasOne(e => e.Location)
                  .WithMany(l => l.LocationAdmins)
                  .HasForeignKey(e => e.LocationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AssignedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedBy)
                  .OnDelete(DeleteBehavior.SetNull);

            // Unique constraint - user can only have one permission level per location
            entity.HasIndex(e => new { e.LocationId, e.UserId }).IsUnique();

            // Indexes for performance
            entity.HasIndex(e => e.LocationId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.PermissionLevel);
        });

        // MemberTransfer entity configuration
        modelBuilder.Entity<MemberTransfer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.MemberId).IsRequired();
            entity.Property(e => e.FromLocationId).IsRequired();
            entity.Property(e => e.ToLocationId).IsRequired();
            entity.Property(e => e.TransferReason).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.RequestedAt).IsRequired();
            entity.Property(e => e.ApprovedAt);
            entity.Property(e => e.ApprovedBy);
            entity.Property(e => e.ApprovalNotes).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.RequestedBy).IsRequired();

            // Foreign key relationships
            entity.HasOne(e => e.Member)
                  .WithMany()
                  .HasForeignKey(e => e.MemberId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.FromLocation)
                  .WithMany()
                  .HasForeignKey(e => e.FromLocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ToLocation)
                  .WithMany()
                  .HasForeignKey(e => e.ToLocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ApprovedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ApprovedBy)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RequestedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.RequestedBy)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            entity.HasIndex(e => e.MemberId);
            entity.HasIndex(e => e.FromLocationId);
            entity.HasIndex(e => e.ToLocationId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.RequestedAt);
        });

        // LocationBranding entity configuration
        modelBuilder.Entity<LocationBranding>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.LocationId).IsRequired();
            entity.Property(e => e.CustomLogoUrl).HasMaxLength(500);
            entity.Property(e => e.ColorScheme).HasColumnType("TEXT");
            entity.Property(e => e.CustomNameOverride).HasMaxLength(200);
            entity.Property(e => e.SettingsJson).HasColumnType("TEXT");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            // One-to-one relationship with Location
            entity.HasOne(e => e.Location)
                  .WithOne(l => l.LocationBranding)
                  .HasForeignKey<LocationBranding>(e => e.LocationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint - one branding per location
            entity.HasIndex(e => e.LocationId).IsUnique();
        });

        // Update Member entity to add LocationId foreign key
        modelBuilder.Entity<Member>(entity =>
        {
            entity.HasOne(m => m.ClubLocation)
                  .WithMany(l => l.Members)
                  .HasForeignKey(m => m.LocationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Update Event entity to add LocationId foreign key
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasOne(e => e.ClubLocation)
                  .WithMany(l => l.EventsAtLocation)
                  .HasForeignKey(e => e.LocationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // AnalyticsEvent entity configuration for decimal precision
        modelBuilder.Entity<AnalyticsEvent>(entity =>
        {
            // Decimal precision configuration for Value property
            entity.Property(e => e.Value).HasColumnType("decimal(18,2)");
        });

        // ABTestCampaign entity configuration for decimal precision
        modelBuilder.Entity<ABTestCampaign>(entity =>
        {
            // Decimal precision configuration for percentage fields
            entity.Property(e => e.ConfidenceLevel).HasColumnType("decimal(5,2)");
            entity.Property(e => e.StatisticalSignificance).HasColumnType("decimal(5,2)");
        });

        // EventSeries entity configuration with owned EventTemplate
        modelBuilder.Entity<EventSeries>(entity =>
        {
            entity.OwnsOne(e => e.EventTemplate, template =>
            {
                template.Property(t => t.Name).HasMaxLength(200);
                template.Property(t => t.Location).HasMaxLength(500);
                template.Property(t => t.Description).HasMaxLength(2000);
                template.Property(t => t.Duration).IsRequired();
                template.Property(t => t.MaxCapacity);
                template.Property(t => t.EventTime).IsRequired();
            });

            // Configure relationship with Event - EventSeriesId is optional (nullable)
            // Use NoAction to avoid multiple cascade paths (Events -> Clubs has cascade, EventSeries -> Clubs has cascade)
            entity.HasMany(e => e.GeneratedEvents)
                .WithOne(e => e.EventSeries)
                .HasForeignKey(e => e.EventSeriesId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // EventSession relationship configuration to avoid cascade delete conflicts
        modelBuilder.Entity<EventSession>(entity =>
        {
            entity.HasOne(e => e.MultiSessionEvent)
                .WithMany(m => m.Sessions)
                .HasForeignKey(e => e.MultiSessionEventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventSessionRegistration>(entity =>
        {
            entity.HasOne(e => e.Session)
                .WithMany(s => s.SessionRegistrations)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.MultiSessionEventRegistration)
                .WithMany(r => r.SessionRegistrations)
                .HasForeignKey(e => e.MultiSessionEventRegistrationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EventSessionAttendance>(entity =>
        {
            entity.HasOne(e => e.Session)
                .WithMany(s => s.SessionAttendances)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                .WithMany()
                .HasForeignKey(e => e.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MultiSessionEventRegistration>(entity =>
        {
            entity.HasOne(e => e.MultiSessionEvent)
                .WithMany(m => m.Registrations)
                .HasForeignKey(e => e.MultiSessionEventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Member)
                .WithMany()
                .HasForeignKey(e => e.MemberId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
