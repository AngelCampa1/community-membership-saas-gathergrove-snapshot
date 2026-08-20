using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GatherGrove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgresCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarketingLeads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Variant = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReferrerUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CurrentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SessionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsContacted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ContactedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsConverted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ConvertedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HasConsent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ConsentWithdrawnAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingLeads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Promotions",
                columns: table => new
                {
                    PromotionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StripeCouponId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StripePromotionCodeId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PromoCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsAutoApply = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    MaxAutoApplyRedemptions = table.Column<int>(type: "integer", nullable: true),
                    AutoApplyRedemptionCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DiscountType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PercentOff = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    AmountOff = table.Column<long>(type: "bigint", nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    Duration = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DurationInMonths = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promotions", x => x.PromotionId);
                });

            migrationBuilder.CreateTable(
                name: "SegmentFilterTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FilterCriteria = table.Column<string>(type: "text", nullable: false),
                    IsSystemTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SegmentFilterTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ActivationToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ActivationTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OnboardingCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppFeedback",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EmailSent = table.Column<bool>(type: "boolean", nullable: false),
                    AppVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OsVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeviceModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ScreenResolution = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BrowserInfo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppFeedback", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppFeedback_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Clubs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Tier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Seed"),
                    TrialExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StripeCustomerId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SubscriptionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StripeAccountId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    StripeAccountCountry = table.Column<string>(type: "text", nullable: true),
                    IsDirectoryEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DirectoryAllowedSharableFields = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsChatEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MembershipExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AppliedPromotionId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clubs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clubs_Promotions_AppliedPromotionId",
                        column: x => x.AppliedPromotionId,
                        principalTable: "Promotions",
                        principalColumn: "PromotionId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Clubs_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExternalAuthProviders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderUserId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ProviderEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailVerifiedAtLinking = table.Column<bool>(type: "boolean", nullable: false),
                    LinkedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalAuthProviders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalAuthProviders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserDeviceTokens",
                columns: table => new
                {
                    UserDeviceTokenId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DeviceToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DeviceType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    LastLogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDeviceTokens", x => x.UserDeviceTokenId);
                    table.ForeignKey(
                        name: "FK_UserDeviceTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AlertConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    EngagementAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    ChurnRiskAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    EventReminderAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    ChurnRiskThreshold = table.Column<int>(type: "integer", nullable: false),
                    EngagementScoreThreshold = table.Column<int>(type: "integer", nullable: false),
                    AlertEmailRecipientsJson = table.Column<string>(type: "text", nullable: false),
                    SlackWebhookUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlertConfigurations_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClubAdminInvites",
                columns: table => new
                {
                    InviteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    InviteToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InvitedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubAdminInvites", x => x.InviteId);
                    table.ForeignKey(
                        name: "FK_ClubAdminInvites_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClubAdminInvites_Users_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClubAdmins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubAdmins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubAdmins_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClubAdmins_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClubBrandings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    SecondaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    FontFamily = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CustomCSS = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: true),
                    WhiteLabelDomain = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FacebookUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TwitterUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    InstagramUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LinkedInUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    YouTubeUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    HideGatherGroveBranding = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CustomFooterText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CustomClubName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FaviconUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubBrandings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubBrandings_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClubChatMessages",
                columns: table => new
                {
                    ChatMessageId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    SenderUserId = table.Column<int>(type: "integer", nullable: false),
                    MessageContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubChatMessages", x => x.ChatMessageId);
                    table.ForeignKey(
                        name: "FK_ClubChatMessages_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClubChatMessages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClubCustomFields",
                columns: table => new
                {
                    CustomFieldId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    FieldLabel = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FieldType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Text"),
                    DropdownOptions = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubCustomFields", x => x.CustomFieldId);
                    table.ForeignKey(
                        name: "FK_ClubCustomFields_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClubEmailUsage",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    UsageMonth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AdminEmailsSentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubEmailUsage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubEmailUsage_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClubLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParentClubId = table.Column<int>(type: "integer", nullable: false),
                    LocationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LocationCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Timezone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SettingsJson = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubLocations_Clubs_ParentClubId",
                        column: x => x.ParentClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    TemplateName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TemplateHtml = table.Column<string>(type: "text", nullable: false),
                    TemplateJson = table.Column<string>(type: "text", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsSystemTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsageCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ErrorLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RequestPath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    Level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AdditionalData = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ErrorLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ErrorLogs_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventEngagementScoringRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    RuleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    AttendanceWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 30m),
                    ParticipationWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 25m),
                    InteractionWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 20m),
                    SatisfactionWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 15m),
                    NetworkingWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 10m),
                    EarlyRegistrationBonus = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    PerfectAttendanceBonus = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    HighParticipationBonus = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    NoShowPenalty = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    LatePenalty = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    EarlyDeparturePenalty = table.Column<decimal>(type: "numeric(4,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventEngagementScoringRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventEngagementScoringRules_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventEngagementScoringRules_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventEngagementTrends",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    TrendPeriod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalEvents = table.Column<int>(type: "integer", nullable: false),
                    AverageAttendance = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    AverageAttendanceRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    AverageEngagementScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    TotalEngagementBoost = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    ActiveMemberCount = table.Column<int>(type: "integer", nullable: false),
                    AverageSatisfaction = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    AverageNPS = table.Column<decimal>(type: "numeric(4,1)", nullable: true),
                    NewMemberEventAttendance = table.Column<int>(type: "integer", nullable: false),
                    MemberRetentionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RepeatAttendanceRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    GrowthRate = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    TrendDirection = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "stable"),
                    TrendInsights = table.Column<string>(type: "text", nullable: false, defaultValue: "{}"),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventEngagementTrends", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventEngagementTrends_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSeries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    RecurrencePattern = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RecurrenceInterval = table.Column<int>(type: "integer", nullable: false),
                    DaysOfWeek = table.Column<int[]>(type: "integer[]", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxEvents = table.Column<int>(type: "integer", nullable: true),
                    EventTemplate_Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EventTemplate_Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EventTemplate_Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    EventTemplate_Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EventTemplate_MaxCapacity = table.Column<int>(type: "integer", nullable: true),
                    EventTemplate_EventTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSeries_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberCustomFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    FieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FieldType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FieldOptions = table.Column<string>(type: "text", nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberCustomFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberCustomFields_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberCustomFields_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberCustomFields_Users_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MemberImports",
                columns: table => new
                {
                    ImportId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    TotalRows = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulRows = table.Column<int>(type: "integer", nullable: false),
                    FailedRows = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ErrorReport = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberImports", x => x.ImportId);
                    table.ForeignKey(
                        name: "FK_MemberImports_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberImports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MemberSegments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FilterCriteria = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystemGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    MemberCount = table.Column<int>(type: "integer", nullable: false),
                    LastCalculated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CalculationDurationMs = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberSegments_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberSegments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MembershipTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DuesAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DuesFrequency = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Monthly"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MembershipTypes_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberTags_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberTags_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MultiSessionEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MaxCapacity = table.Column<int>(type: "integer", nullable: true),
                    RegistrationRequired = table.Column<bool>(type: "boolean", nullable: false),
                    AllowIndividualSessionRegistration = table.Column<bool>(type: "boolean", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MultiSessionEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MultiSessionEvents_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonalizationTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    TokenName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DataSource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DefaultValue = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsSystemToken = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonalizationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonalizationTokens_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonalizationTokens_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScheduledReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    ReportName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ReportType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Format = table.Column<int>(type: "integer", nullable: false),
                    Frequency = table.Column<int>(type: "integer", nullable: false),
                    WeeklyDayOfWeek = table.Column<int>(type: "integer", nullable: true),
                    MonthlyDayOfMonth = table.Column<int>(type: "integer", nullable: true),
                    DeliveryTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Recipients = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    NextRunDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastExecuted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IncludeCharts = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CustomFilters = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduledReports_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LocationAdmins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PermissionLevel = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssignedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationAdmins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LocationAdmins_ClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocationAdmins_Users_AssignedBy",
                        column: x => x.AssignedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LocationAdmins_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LocationBrandings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    CustomLogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ColorScheme = table.Column<string>(type: "TEXT", nullable: true),
                    CustomNameOverride = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SettingsJson = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationBrandings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LocationBrandings_ClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    LocationId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EventDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    MaxCapacity = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MemberPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NonMemberPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    EarlyBirdPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    EarlyBirdDeadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GroupDiscountThreshold = table.Column<int>(type: "integer", nullable: true),
                    GroupDiscountPercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentToken = table.Column<string>(type: "text", nullable: true),
                    EventSeriesId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_ClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Events_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Events_EventSeries_EventSeriesId",
                        column: x => x.EventSeriesId,
                        principalTable: "EventSeries",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ABTestCampaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    CampaignName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TestType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    VariantATemplateId = table.Column<int>(type: "integer", nullable: true),
                    VariantASubject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VariantAContent = table.Column<string>(type: "text", nullable: true),
                    VariantBTemplateId = table.Column<int>(type: "integer", nullable: true),
                    VariantBSubject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VariantBContent = table.Column<string>(type: "text", nullable: true),
                    TestPercentage = table.Column<int>(type: "integer", nullable: false),
                    MinimumSampleSize = table.Column<int>(type: "integer", nullable: false),
                    ConfidenceLevel = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WinnerId = table.Column<int>(type: "integer", nullable: true),
                    WinnerVariant = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    StatisticalSignificance = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    SegmentId = table.Column<int>(type: "integer", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ABTestCampaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ABTestCampaigns_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ABTestCampaigns_EmailTemplates_VariantATemplateId",
                        column: x => x.VariantATemplateId,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ABTestCampaigns_EmailTemplates_VariantBTemplateId",
                        column: x => x.VariantBTemplateId,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ABTestCampaigns_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ABTestCampaigns_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunicationWorkflows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    WorkflowName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TriggerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TriggerConfig = table.Column<string>(type: "text", nullable: true),
                    WorkflowSteps = table.Column<string>(type: "text", nullable: false),
                    SegmentId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TriggerCount = table.Column<int>(type: "integer", nullable: false),
                    SuccessCount = table.Column<int>(type: "integer", nullable: false),
                    FailureCount = table.Column<int>(type: "integer", nullable: false),
                    LastTriggeredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunicationWorkflows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunicationWorkflows_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunicationWorkflows_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationWorkflows_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberInviteCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MembershipTypeId = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MaxUses = table.Column<int>(type: "integer", nullable: true),
                    CurrentUses = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberInviteCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberInviteCodes_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberInviteCodes_MembershipTypes_MembershipTypeId",
                        column: x => x.MembershipTypeId,
                        principalTable: "MembershipTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberInviteCodes_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MultiSessionEventId = table.Column<int>(type: "integer", nullable: false),
                    SessionNumber = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    StartDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MaxCapacity = table.Column<int>(type: "integer", nullable: true),
                    Prerequisites = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Materials = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessions_MultiSessionEvents_MultiSessionEventId",
                        column: x => x.MultiSessionEventId,
                        principalTable: "MultiSessionEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReportExecutionHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ScheduleId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReportSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    ExecutionTimeSeconds = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    JobId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReportFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportExecutionHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportExecutionHistories_ScheduledReports_ScheduleId",
                        column: x => x.ScheduleId,
                        principalTable: "ScheduledReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventAnalyticsMetrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    TotalRegistrations = table.Column<int>(type: "integer", nullable: false),
                    TotalAttendees = table.Column<int>(type: "integer", nullable: false),
                    AttendanceRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    NoShowRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    AverageParticipationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    AverageSessionDuration = table.Column<int>(type: "integer", nullable: false),
                    TotalInteractions = table.Column<int>(type: "integer", nullable: false),
                    UniqueParticipants = table.Column<int>(type: "integer", nullable: false),
                    AverageSatisfactionRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    AverageNPS = table.Column<decimal>(type: "numeric(4,1)", nullable: true),
                    SurveyResponseRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    HighlyActiveCount = table.Column<int>(type: "integer", nullable: false),
                    ActiveCount = table.Column<int>(type: "integer", nullable: false),
                    ModerateCount = table.Column<int>(type: "integer", nullable: false),
                    PassiveCount = table.Column<int>(type: "integer", nullable: false),
                    DisengagedCount = table.Column<int>(type: "integer", nullable: false),
                    MobileUsagePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    TechnicalIssuesCount = table.Column<int>(type: "integer", nullable: false),
                    NetworkingConnectionsMade = table.Column<int>(type: "integer", nullable: false),
                    ResourceDownloads = table.Column<int>(type: "integer", nullable: false),
                    FollowUpEngagements = table.Column<int>(type: "integer", nullable: false),
                    TotalEngagementBoost = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    AverageEngagementBoost = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    MembersWithBoost = table.Column<int>(type: "integer", nullable: false),
                    ComparedToClubAverage = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    ComparedToEventType = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    EventSuccessScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalEvents = table.Column<int>(type: "integer", nullable: false),
                    AverageAttendance = table.Column<double>(type: "double precision", nullable: false),
                    EngagementScore = table.Column<double>(type: "double precision", nullable: false),
                    RevenueGenerated = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TopPerformingEventType = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventAnalyticsMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventAnalyticsMetrics_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EventAnalyticsMetrics_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventFeedbackSurveys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IsAnonymous = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ClosesAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventFeedbackSurveys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventFeedbackSurveys_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventQRCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    QRCodeToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    QRCodeType = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AllowMultipleScans = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RequireRSVP = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    QRCodeImageData = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventQRCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventQRCodes_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunicationsLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    CommunicationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Body = table.Column<string>(type: "text", nullable: false),
                    RecipientCount = table.Column<int>(type: "integer", nullable: false),
                    Recipients = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    SentByUserId = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TemplateId = table.Column<int>(type: "integer", nullable: true),
                    ABTestCampaignId = table.Column<int>(type: "integer", nullable: true),
                    WorkflowId = table.Column<int>(type: "integer", nullable: true),
                    SegmentId = table.Column<int>(type: "integer", nullable: true),
                    ScheduledFor = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunicationsLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_ABTestCampaigns_ABTestCampaignId",
                        column: x => x.ABTestCampaignId,
                        principalTable: "ABTestCampaigns",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_CommunicationWorkflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "CommunicationWorkflows",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_EmailTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationsLogs_Users_SentByUserId",
                        column: x => x.SentByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    MembershipTypeId = table.Column<int>(type: "integer", nullable: false),
                    LocationId = table.Column<int>(type: "integer", nullable: true),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    JoinDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DuesPaidUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HasSmsConsent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsListedInDirectory = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DirectoryVisibleFields = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    InviteCodeId = table.Column<int>(type: "integer", nullable: true),
                    SSN = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Members_ClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Members_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Members_MemberInviteCodes_InviteCodeId",
                        column: x => x.InviteCodeId,
                        principalTable: "MemberInviteCodes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Members_MembershipTypes_MembershipTypeId",
                        column: x => x.MembershipTypeId,
                        principalTable: "MembershipTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SurveyQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SurveyId = table.Column<int>(type: "integer", nullable: false),
                    QuestionOrder = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    Options = table.Column<List<string>>(type: "text[]", nullable: true),
                    MinValue = table.Column<int>(type: "integer", nullable: true),
                    MaxValue = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SurveyQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SurveyQuestions_EventFeedbackSurveys_SurveyId",
                        column: x => x.SurveyId,
                        principalTable: "EventFeedbackSurveys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnalyticsSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    MemberId = table.Column<int>(type: "integer", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OperatingSystem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IpAddressHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CountryCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    EntryUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ExitUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EventCount = table.Column<int>(type: "integer", nullable: false),
                    PageViewCount = table.Column<int>(type: "integer", nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    IsLoginSession = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LoginStreakDays = table.Column<int>(type: "integer", nullable: false),
                    LoginMethod = table.Column<string>(type: "text", nullable: true),
                    IsSuccessfulLogin = table.Column<bool>(type: "boolean", nullable: false),
                    LoginFailureReason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyticsSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnalyticsSessions_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AnalyticsSessions_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AnalyticsSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommunicationAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CommunicationId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    TrackingId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ABTestCampaignId = table.Column<int>(type: "integer", nullable: true),
                    VariantName = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    TemplateId = table.Column<int>(type: "integer", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OpenCount = table.Column<int>(type: "integer", nullable: false),
                    ClickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClickCount = table.Column<int>(type: "integer", nullable: false),
                    UnsubscribedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BouncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BounceReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmailClient = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunicationAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunicationAnalytics_ABTestCampaigns_ABTestCampaignId",
                        column: x => x.ABTestCampaignId,
                        principalTable: "ABTestCampaigns",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationAnalytics_CommunicationsLogs_CommunicationId",
                        column: x => x.CommunicationId,
                        principalTable: "CommunicationsLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunicationAnalytics_EmailTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunicationAnalytics_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    AttendedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CheckInTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckOutTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AttendanceStatus = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventAttendances_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventAttendances_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventCheckins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    CheckinTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CheckoutTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckinMethod = table.Column<int>(type: "integer", nullable: false),
                    CheckinLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    QRCodeToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventCheckins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventCheckins_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventCheckins_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventEngagementTrackings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    RegistrationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "registered"),
                    AttendanceStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    AttendancePercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    CheckInTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckOutTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SessionDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    InteractionCount = table.Column<int>(type: "integer", nullable: false),
                    NetworkingConnections = table.Column<int>(type: "integer", nullable: false),
                    ParticipationLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "passive"),
                    ParticipationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    QuestionsAsked = table.Column<int>(type: "integer", nullable: false),
                    PollsParticipated = table.Column<int>(type: "integer", nullable: false),
                    ResourcesDownloaded = table.Column<int>(type: "integer", nullable: false),
                    ChatMessages = table.Column<int>(type: "integer", nullable: false),
                    BreakoutParticipation = table.Column<bool>(type: "boolean", nullable: false),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "web"),
                    DeviceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ConnectionQuality = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TechnicalIssues = table.Column<bool>(type: "boolean", nullable: false),
                    FocusScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    AttentionSpan = table.Column<int>(type: "integer", nullable: true),
                    MultitaskingDetected = table.Column<bool>(type: "boolean", nullable: false),
                    PostEventSurveyCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    SatisfactionRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    NetPromoterScore = table.Column<int>(type: "integer", nullable: true),
                    EngagementBoost = table.Column<decimal>(type: "numeric(6,2)", nullable: false, defaultValue: 0m),
                    LastEngagementUpdate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventEngagementTrackings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventEngagementTrackings_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventEngagementTrackings_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventFeedbackAnalyses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    SurveyResponseId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OverallSatisfaction = table.Column<decimal>(type: "numeric(3,1)", nullable: false),
                    NetPromoterScore = table.Column<int>(type: "integer", nullable: false),
                    ContentQualityRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    PresentationRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    OrganizationRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    NetworkingRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    TechnologyRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    PositiveFeedback = table.Column<string>(type: "text", nullable: true),
                    NegativeFeedback = table.Column<string>(type: "text", nullable: true),
                    Suggestions = table.Column<string>(type: "text", nullable: true),
                    SentimentScore = table.Column<decimal>(type: "numeric(4,2)", nullable: true),
                    SentimentLabel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    KeyTopics = table.Column<string>(type: "text", nullable: false, defaultValue: "[]"),
                    WillAttendFutureEvents = table.Column<bool>(type: "boolean", nullable: true),
                    WouldRecommendToOthers = table.Column<bool>(type: "boolean", nullable: true),
                    EngagementMotivation = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ResponseDuration = table.Column<int>(type: "integer", nullable: true),
                    ResponseCompleteness = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 100m),
                    ResponseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventFeedbackAnalyses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventFeedbackAnalyses_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventFeedbackAnalyses_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventFeedbackResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SurveyId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventFeedbackResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventFeedbackResponses_EventFeedbackSurveys_SurveyId",
                        column: x => x.SurveyId,
                        principalTable: "EventFeedbackSurveys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventFeedbackResponses_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventFeedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventFeedbacks_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventFeedbacks_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventRecommendations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    RecommendationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ConfidenceLevel = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RecommendationFactors = table.Column<string>(type: "text", nullable: false, defaultValue: "{}"),
                    PastEngagementFactor = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    InterestAlignmentFactor = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    SocialConnectionsFactor = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    TimingPreferenceFactor = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    DiversityFactor = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "active"),
                    PresentedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponseAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TestGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RecommendationMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "algorithm_v1"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventRecommendations_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventRecommendations_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventRsvps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    RsvpStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PaymentStatus = table.Column<int>(type: "integer", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    StripePaymentIntentId = table.Column<string>(type: "text", nullable: true),
                    GuestName = table.Column<string>(type: "text", nullable: true),
                    GuestEmail = table.Column<string>(type: "text", nullable: true),
                    GuestPhone = table.Column<string>(type: "text", nullable: true),
                    IsGuestRegistration = table.Column<bool>(type: "boolean", nullable: false),
                    MembershipUpgradeTypeId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventRsvps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventRsvps_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventRsvps_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventRsvps_MembershipTypes_MembershipUpgradeTypeId",
                        column: x => x.MembershipUpgradeTypeId,
                        principalTable: "MembershipTypes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventSessionAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    AttendedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckOutTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionAttendances_EventSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "EventSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventSessionAttendances_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventWaitlists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NotificationSent = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventWaitlists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventWaitlists_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventWaitlists_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberCustomFieldValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    CustomFieldId = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true),
                    MemberCustomFieldId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberCustomFieldValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberCustomFieldValues_MemberCustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "MemberCustomFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberCustomFieldValues_MemberCustomFields_MemberCustomFiel~",
                        column: x => x.MemberCustomFieldId,
                        principalTable: "MemberCustomFields",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MemberCustomFieldValues_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberCustomFieldValues_Users_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MemberEngagementAlerts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    TriggerScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    PreviousScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    ScoreChange = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RecommendedActions = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NotificationsSent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LastNotificationSent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberEngagementAlerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberEngagementAlerts_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberEngagementAlerts_Users_ResolvedByUserId",
                        column: x => x.ResolvedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MemberEngagementHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    LoginFrequencyScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EventParticipationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CommunicationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    FeatureUsageScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ProfileCompletenessScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MetricsSnapshot = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberEngagementHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberEngagementHistories_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberEngagementScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    LoginScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EventScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CommunicationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    FeatureUsageScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ProfileCompletenessScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CalculatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LoginCount7Days = table.Column<int>(type: "integer", nullable: false),
                    LoginCount30Days = table.Column<int>(type: "integer", nullable: false),
                    LoginCount90Days = table.Column<int>(type: "integer", nullable: false),
                    LastLoginDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LoginStreakDays = table.Column<int>(type: "integer", nullable: false),
                    AverageSessionDurationMinutes = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ActivityLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EngagementLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DaysSinceLastLogin = table.Column<int>(type: "integer", nullable: false),
                    IsAtRisk = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberEngagementScores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberEngagementScores_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberEngagementScores_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MemberEventEngagementScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    TotalEventsAttended = table.Column<int>(type: "integer", nullable: false),
                    EventAttendanceRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    AverageEventEngagementScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    PreferredEventTypes = table.Column<string>(type: "text", nullable: false, defaultValue: "[]"),
                    PreferredEventTimes = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConsistencyScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    HighEngagementEventsCount = table.Column<int>(type: "integer", nullable: false),
                    LowEngagementEventsCount = table.Column<int>(type: "integer", nullable: false),
                    AverageSatisfactionRating = table.Column<decimal>(type: "numeric(3,1)", nullable: true),
                    NetworkingScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    PeerInfluenceScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CommunityContribution = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EventRetentionProbability = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EngagementTrend = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "stable"),
                    RiskLevel = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "low"),
                    Recent90DayEvents = table.Column<int>(type: "integer", nullable: false),
                    Recent90DayEngagementScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Recent90DayTrend = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    ContributionToOverallScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    LastEngagementScoreUpdate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberEventEngagementScores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberEventEngagementScores_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberEventQRCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    QRCodeToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    QRCodeImageData = table.Column<string>(type: "text", nullable: true),
                    CustomData = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberEventQRCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberEventQRCodes_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberEventQRCodes_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberLoginTrackings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    LoginTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SessionDuration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "web"),
                    DeviceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LocationCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsSuccessful = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberLoginTrackings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberLoginTrackings_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberSegmentCache",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    SegmentId = table.Column<int>(type: "integer", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsValid = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberSegmentCache", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberSegmentCache_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberSegmentCache_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberSegmentHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    SegmentId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ChangedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberSegmentHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberSegmentHistory_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberSegmentHistory_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberSegmentHistory_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MemberTagAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    TagId = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssignedByUserId = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberTagAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberTagAssignments_MemberTags_TagId",
                        column: x => x.TagId,
                        principalTable: "MemberTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberTagAssignments_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberTagAssignments_Users_AssignedByUserId",
                        column: x => x.AssignedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberTransfers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    FromLocationId = table.Column<int>(type: "integer", nullable: false),
                    ToLocationId = table.Column<int>(type: "integer", nullable: false),
                    TransferReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedBy = table.Column<int>(type: "integer", nullable: true),
                    ApprovalNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedBy = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberTransfers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberTransfers_ClubLocations_FromLocationId",
                        column: x => x.FromLocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberTransfers_ClubLocations_ToLocationId",
                        column: x => x.ToLocationId,
                        principalTable: "ClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberTransfers_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberTransfers_Users_ApprovedBy",
                        column: x => x.ApprovedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MemberTransfers_Users_RequestedBy",
                        column: x => x.RequestedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MultiSessionEventRegistrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MultiSessionEventId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    RegisteredForAllSessions = table.Column<bool>(type: "boolean", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PaymentStatus = table.Column<int>(type: "integer", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MultiSessionEventRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MultiSessionEventRegistrations_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MultiSessionEventRegistrations_MultiSessionEvents_MultiSess~",
                        column: x => x.MultiSessionEventId,
                        principalTable: "MultiSessionEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    PaymentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.PaymentId);
                    table.ForeignKey(
                        name: "FK_Payments_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTokens",
                columns: table => new
                {
                    PaymentTokenId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTokens", x => x.PaymentTokenId);
                    table.ForeignKey(
                        name: "FK_PaymentTokens_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PaymentTokens_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProfileCompletenessTrackings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    CompletionPercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RequiredFieldsTotal = table.Column<int>(type: "integer", nullable: false),
                    RequiredFieldsCompleted = table.Column<int>(type: "integer", nullable: false),
                    OptionalFieldsTotal = table.Column<int>(type: "integer", nullable: false),
                    OptionalFieldsCompleted = table.Column<int>(type: "integer", nullable: false),
                    IncompleteFields = table.Column<string>(type: "text", nullable: false, defaultValue: "[]"),
                    RecentlyCompletedFields = table.Column<string>(type: "text", nullable: false, defaultValue: "[]"),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfileCompletenessTrackings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfileCompletenessTrackings_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QRCodeScans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QRCodeId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    ScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ScanLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ScanMethod = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsSuccessful = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QRCodeScans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QRCodeScans_EventQRCodes_QRCodeId",
                        column: x => x.QRCodeId,
                        principalTable: "EventQRCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QRCodeScans_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RsvpTokens",
                columns: table => new
                {
                    RsvpTokenId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TokenValue = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    IntendedRsvpStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RsvpTokens", x => x.RsvpTokenId);
                    table.ForeignKey(
                        name: "FK_RsvpTokens_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RsvpTokens_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SegmentMembers",
                columns: table => new
                {
                    SegmentId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AddedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SegmentMembers", x => new { x.SegmentId, x.MemberId });
                    table.ForeignKey(
                        name: "FK_SegmentMembers_MemberSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "MemberSegments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SegmentMembers_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SegmentMembers_Users_AddedBy",
                        column: x => x.AddedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SMSMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    CommunicationId = table.Column<int>(type: "integer", nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MessageContent = table.Column<string>(type: "character varying(1600)", maxLength: 1600, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SegmentCount = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StatusUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SMSMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SMSMessages_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SMSMessages_CommunicationsLogs_CommunicationId",
                        column: x => x.CommunicationId,
                        principalTable: "CommunicationsLogs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SMSMessages_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SMSMessages_Users_SentByUserId",
                        column: x => x.SentByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnalyticsEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Label = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ClubId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    MemberId = table.Column<int>(type: "integer", nullable: true),
                    SessionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OperatingSystem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IpAddressHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CountryCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReferrerUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyticsEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnalyticsEvents_AnalyticsSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "AnalyticsSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnalyticsEvents_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AnalyticsEvents_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AnalyticsEvents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SurveyResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FeedbackResponseId = table.Column<int>(type: "integer", nullable: false),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    Answer = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    NumericValue = table.Column<int>(type: "integer", nullable: true),
                    QuestionType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SurveyResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SurveyResponses_EventFeedbackResponses_FeedbackResponseId",
                        column: x => x.FeedbackResponseId,
                        principalTable: "EventFeedbackResponses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SurveyResponses_SurveyQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "SurveyQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberActivitySessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    MemberEngagementScoreId = table.Column<int>(type: "integer", nullable: true),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    PageViews = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ActionsPerformed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MessagesSent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    EventInteractions = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "web"),
                    DeviceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReferrerUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QualityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberActivitySessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberActivitySessions_MemberEngagementScores_MemberEngagem~",
                        column: x => x.MemberEngagementScoreId,
                        principalTable: "MemberEngagementScores",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MemberActivitySessions_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSessionRegistrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    MultiSessionEventRegistrationId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionRegistrations_EventSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "EventSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventSessionRegistrations_MultiSessionEventRegistrations_Mu~",
                        column: x => x.MultiSessionEventRegistrationId,
                        principalTable: "MultiSessionEventRegistrations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FeatureUsageEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    FeatureName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Context = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Duration = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    MemberTenureDays = table.Column<int>(type: "integer", nullable: false),
                    MemberTenure = table.Column<int>(type: "integer", nullable: false),
                    EngagementWeight = table.Column<decimal>(type: "numeric(3,1)", nullable: false, defaultValue: 1.0m),
                    MemberActivitySessionId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureUsageEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureUsageEvents_AnalyticsSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "AnalyticsSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureUsageEvents_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureUsageEvents_MemberActivitySessions_MemberActivitySes~",
                        column: x => x.MemberActivitySessionId,
                        principalTable: "MemberActivitySessions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FeatureUsageEvents_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ABTestCampaigns_ClubId",
                table: "ABTestCampaigns",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ABTestCampaigns_CreatedByUserId",
                table: "ABTestCampaigns",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ABTestCampaigns_SegmentId",
                table: "ABTestCampaigns",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ABTestCampaigns_VariantATemplateId",
                table: "ABTestCampaigns",
                column: "VariantATemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ABTestCampaigns_VariantBTemplateId",
                table: "ABTestCampaigns",
                column: "VariantBTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_AlertConfigurations_ClubId",
                table: "AlertConfigurations",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsEvents_ClubId",
                table: "AnalyticsEvents",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsEvents_MemberId",
                table: "AnalyticsEvents",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsEvents_SessionId",
                table: "AnalyticsEvents",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsEvents_UserId",
                table: "AnalyticsEvents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsSessions_ClubId",
                table: "AnalyticsSessions",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsSessions_MemberId",
                table: "AnalyticsSessions",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsSessions_UserId",
                table: "AnalyticsSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppFeedback_UserId",
                table: "AppFeedback",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdminInvites_ClubId_Email",
                table: "ClubAdminInvites",
                columns: new[] { "ClubId", "Email" });

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdminInvites_ExpiresAt",
                table: "ClubAdminInvites",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdminInvites_InvitedByUserId",
                table: "ClubAdminInvites",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdminInvites_InviteToken",
                table: "ClubAdminInvites",
                column: "InviteToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdmins_ClubId",
                table: "ClubAdmins",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubAdmins_UserId_ClubId",
                table: "ClubAdmins",
                columns: new[] { "UserId", "ClubId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClubBrandings_ClubId",
                table: "ClubBrandings",
                column: "ClubId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClubBrandings_WhiteLabelDomain",
                table: "ClubBrandings",
                column: "WhiteLabelDomain");

            migrationBuilder.CreateIndex(
                name: "IX_ClubChatMessages_ClubId_SentAt",
                table: "ClubChatMessages",
                columns: new[] { "ClubId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ClubChatMessages_SenderUserId",
                table: "ClubChatMessages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubCustomFields_ClubId",
                table: "ClubCustomFields",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubCustomFields_ClubId_FieldLabel",
                table: "ClubCustomFields",
                columns: new[] { "ClubId", "FieldLabel" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClubEmailUsage_ClubId_UsageMonth",
                table: "ClubEmailUsage",
                columns: new[] { "ClubId", "UsageMonth" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClubLocations_IsActive",
                table: "ClubLocations",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ClubLocations_ParentClubId",
                table: "ClubLocations",
                column: "ParentClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubLocations_ParentClubId_LocationCode",
                table: "ClubLocations",
                columns: new[] { "ParentClubId", "LocationCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_AppliedPromotionId",
                table: "Clubs",
                column: "AppliedPromotionId");

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_CreatedByUserId",
                table: "Clubs",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_StripeAccountId",
                table: "Clubs",
                column: "StripeAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_StripeCustomerId",
                table: "Clubs",
                column: "StripeCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_StripeSubscriptionId",
                table: "Clubs",
                column: "StripeSubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_TrialExpiresAt",
                table: "Clubs",
                column: "TrialExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationAnalytics_ABTestCampaignId",
                table: "CommunicationAnalytics",
                column: "ABTestCampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationAnalytics_CommunicationId",
                table: "CommunicationAnalytics",
                column: "CommunicationId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationAnalytics_MemberId",
                table: "CommunicationAnalytics",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationAnalytics_TemplateId",
                table: "CommunicationAnalytics",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_ABTestCampaignId",
                table: "CommunicationsLogs",
                column: "ABTestCampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_ClubId_SentAt",
                table: "CommunicationsLogs",
                columns: new[] { "ClubId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_CommunicationType",
                table: "CommunicationsLogs",
                column: "CommunicationType");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_SegmentId",
                table: "CommunicationsLogs",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_SentByUserId",
                table: "CommunicationsLogs",
                column: "SentByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_TemplateId",
                table: "CommunicationsLogs",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationsLogs_WorkflowId",
                table: "CommunicationsLogs",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationWorkflows_ClubId",
                table: "CommunicationWorkflows",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationWorkflows_CreatedByUserId",
                table: "CommunicationWorkflows",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunicationWorkflows_SegmentId",
                table: "CommunicationWorkflows",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_ClubId",
                table: "EmailTemplates",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_CreatedByUserId",
                table: "EmailTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_UpdatedByUserId",
                table: "EmailTemplates",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLogs_ClubId",
                table: "ErrorLogs",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_EventAnalyticsMetrics_AttendanceRate",
                table: "EventAnalyticsMetrics",
                column: "AttendanceRate");

            migrationBuilder.CreateIndex(
                name: "IX_EventAnalyticsMetrics_ClubId_CalculatedAt",
                table: "EventAnalyticsMetrics",
                columns: new[] { "ClubId", "CalculatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EventAnalyticsMetrics_EventId",
                table: "EventAnalyticsMetrics",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventAnalyticsMetrics_EventSuccessScore",
                table: "EventAnalyticsMetrics",
                column: "EventSuccessScore");

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendances_AttendedAt",
                table: "EventAttendances",
                column: "AttendedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendances_EventId_MemberId",
                table: "EventAttendances",
                columns: new[] { "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendances_MemberId",
                table: "EventAttendances",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCheckins_EventId",
                table: "EventCheckins",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCheckins_MemberId",
                table: "EventCheckins",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementScoringRules_ClubId_EventType_IsActive",
                table: "EventEngagementScoringRules",
                columns: new[] { "ClubId", "EventType", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementScoringRules_CreatedByUserId",
                table: "EventEngagementScoringRules",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementScoringRules_Priority",
                table: "EventEngagementScoringRules",
                column: "Priority",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrackings_CreatedAt",
                table: "EventEngagementTrackings",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrackings_EventId_AttendanceStatus",
                table: "EventEngagementTrackings",
                columns: new[] { "EventId", "AttendanceStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrackings_EventId_MemberId",
                table: "EventEngagementTrackings",
                columns: new[] { "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrackings_MemberId_ParticipationScore",
                table: "EventEngagementTrackings",
                columns: new[] { "MemberId", "ParticipationScore" });

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrackings_ParticipationLevel",
                table: "EventEngagementTrackings",
                column: "ParticipationLevel");

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrends_ClubId_TrendPeriod_PeriodStart",
                table: "EventEngagementTrends",
                columns: new[] { "ClubId", "TrendPeriod", "PeriodStart" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventEngagementTrends_TrendDirection",
                table: "EventEngagementTrends",
                column: "TrendDirection");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackAnalyses_EventId_MemberId",
                table: "EventFeedbackAnalyses",
                columns: new[] { "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackAnalyses_EventId_OverallSatisfaction",
                table: "EventFeedbackAnalyses",
                columns: new[] { "EventId", "OverallSatisfaction" });

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackAnalyses_MemberId",
                table: "EventFeedbackAnalyses",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackAnalyses_NetPromoterScore",
                table: "EventFeedbackAnalyses",
                column: "NetPromoterScore");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackAnalyses_ResponseDate",
                table: "EventFeedbackAnalyses",
                column: "ResponseDate");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackResponses_MemberId",
                table: "EventFeedbackResponses",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackResponses_SurveyId",
                table: "EventFeedbackResponses",
                column: "SurveyId");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbacks_EventId",
                table: "EventFeedbacks",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbacks_MemberId",
                table: "EventFeedbacks",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventFeedbackSurveys_EventId",
                table: "EventFeedbackSurveys",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventQRCodes_EventId",
                table: "EventQRCodes",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventQRCodes_ExpiresAt",
                table: "EventQRCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_EventQRCodes_IsActive",
                table: "EventQRCodes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_EventQRCodes_QRCodeToken",
                table: "EventQRCodes",
                column: "QRCodeToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventRecommendations_EventId",
                table: "EventRecommendations",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventRecommendations_ExpiresAt",
                table: "EventRecommendations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_EventRecommendations_MemberId_RecommendationScore_Status",
                table: "EventRecommendations",
                columns: new[] { "MemberId", "RecommendationScore", "Status" },
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_EventRecommendations_Status_CreatedAt",
                table: "EventRecommendations",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EventRsvps_EventId_MemberId",
                table: "EventRsvps",
                columns: new[] { "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventRsvps_MemberId",
                table: "EventRsvps",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventRsvps_MembershipUpgradeTypeId",
                table: "EventRsvps",
                column: "MembershipUpgradeTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_EventRsvps_RsvpStatus",
                table: "EventRsvps",
                column: "RsvpStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Events_ClubId_EventDateTime",
                table: "Events",
                columns: new[] { "ClubId", "EventDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventSeriesId",
                table: "Events",
                column: "EventSeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_LocationId",
                table: "Events",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeries_ClubId",
                table: "EventSeries",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionAttendances_MemberId",
                table: "EventSessionAttendances",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionAttendances_SessionId",
                table: "EventSessionAttendances",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionRegistrations_MultiSessionEventRegistrationId",
                table: "EventSessionRegistrations",
                column: "MultiSessionEventRegistrationId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionRegistrations_SessionId",
                table: "EventSessionRegistrations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessions_MultiSessionEventId",
                table: "EventSessions",
                column: "MultiSessionEventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventWaitlists_EventId",
                table: "EventWaitlists",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventWaitlists_MemberId",
                table: "EventWaitlists",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalAuthProviders_Provider_ProviderUserId",
                table: "ExternalAuthProviders",
                columns: new[] { "Provider", "ProviderUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalAuthProviders_UserId",
                table: "ExternalAuthProviders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_ClubId_UsedAt",
                table: "FeatureUsageEvents",
                columns: new[] { "ClubId", "UsedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_FeatureName",
                table: "FeatureUsageEvents",
                column: "FeatureName");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_MemberActivitySessionId",
                table: "FeatureUsageEvents",
                column: "MemberActivitySessionId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_MemberId_UsedAt",
                table: "FeatureUsageEvents",
                columns: new[] { "MemberId", "UsedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_Platform",
                table: "FeatureUsageEvents",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureUsageEvents_SessionId",
                table: "FeatureUsageEvents",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationAdmins_AssignedBy",
                table: "LocationAdmins",
                column: "AssignedBy");

            migrationBuilder.CreateIndex(
                name: "IX_LocationAdmins_LocationId",
                table: "LocationAdmins",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationAdmins_LocationId_UserId",
                table: "LocationAdmins",
                columns: new[] { "LocationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LocationAdmins_PermissionLevel",
                table: "LocationAdmins",
                column: "PermissionLevel");

            migrationBuilder.CreateIndex(
                name: "IX_LocationAdmins_UserId",
                table: "LocationAdmins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationBrandings_LocationId",
                table: "LocationBrandings",
                column: "LocationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_CreatedAt",
                table: "MarketingLeads",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_Email",
                table: "MarketingLeads",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_IsContacted",
                table: "MarketingLeads",
                column: "IsContacted");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_IsConverted",
                table: "MarketingLeads",
                column: "IsConverted");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_Source",
                table: "MarketingLeads",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_Source_CreatedAt",
                table: "MarketingLeads",
                columns: new[] { "Source", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberActivitySessions_IsActive",
                table: "MemberActivitySessions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_MemberActivitySessions_MemberEngagementScoreId",
                table: "MemberActivitySessions",
                column: "MemberEngagementScoreId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberActivitySessions_MemberId_StartTime",
                table: "MemberActivitySessions",
                columns: new[] { "MemberId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberActivitySessions_QualityScore",
                table: "MemberActivitySessions",
                column: "QualityScore");

            migrationBuilder.CreateIndex(
                name: "IX_MemberActivitySessions_SessionId",
                table: "MemberActivitySessions",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFields_ClubId",
                table: "MemberCustomFields",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFields_CreatedBy",
                table: "MemberCustomFields",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFields_UpdatedBy",
                table: "MemberCustomFields",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFieldValues_CustomFieldId",
                table: "MemberCustomFieldValues",
                column: "CustomFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFieldValues_MemberCustomFieldId",
                table: "MemberCustomFieldValues",
                column: "MemberCustomFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFieldValues_MemberId",
                table: "MemberCustomFieldValues",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFieldValues_MemberId_CustomFieldId",
                table: "MemberCustomFieldValues",
                columns: new[] { "MemberId", "CustomFieldId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberCustomFieldValues_UpdatedBy",
                table: "MemberCustomFieldValues",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementAlerts_CreatedAt",
                table: "MemberEngagementAlerts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementAlerts_MemberId_IsResolved",
                table: "MemberEngagementAlerts",
                columns: new[] { "MemberId", "IsResolved" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementAlerts_ResolvedByUserId",
                table: "MemberEngagementAlerts",
                column: "ResolvedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementAlerts_Severity",
                table: "MemberEngagementAlerts",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementHistories_Level",
                table: "MemberEngagementHistories",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementHistories_MemberId_RecordedAt",
                table: "MemberEngagementHistories",
                columns: new[] { "MemberId", "RecordedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementScores_ClubId_CalculatedDate",
                table: "MemberEngagementScores",
                columns: new[] { "ClubId", "CalculatedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementScores_EngagementLevel",
                table: "MemberEngagementScores",
                column: "EngagementLevel");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementScores_MemberId_ClubId",
                table: "MemberEngagementScores",
                columns: new[] { "MemberId", "ClubId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberEngagementScores_OverallScore",
                table: "MemberEngagementScores",
                column: "OverallScore");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventEngagementScores_AverageEventEngagementScore",
                table: "MemberEventEngagementScores",
                column: "AverageEventEngagementScore");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventEngagementScores_EngagementTrend",
                table: "MemberEventEngagementScores",
                column: "EngagementTrend");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventEngagementScores_MemberId",
                table: "MemberEventEngagementScores",
                column: "MemberId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventEngagementScores_RiskLevel",
                table: "MemberEventEngagementScores",
                column: "RiskLevel");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_EventId",
                table: "MemberEventQRCodes",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_EventId_MemberId",
                table: "MemberEventQRCodes",
                columns: new[] { "EventId", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_ExpiresAt",
                table: "MemberEventQRCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_IsActive",
                table: "MemberEventQRCodes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_MemberId",
                table: "MemberEventQRCodes",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberEventQRCodes_QRCodeToken",
                table: "MemberEventQRCodes",
                column: "QRCodeToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberImports_ClubId_CreatedAt",
                table: "MemberImports",
                columns: new[] { "ClubId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberImports_UserId",
                table: "MemberImports",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_ClubId",
                table: "MemberInviteCodes",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_ClubId_IsActive",
                table: "MemberInviteCodes",
                columns: new[] { "ClubId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_Code",
                table: "MemberInviteCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_CreatedByUserId",
                table: "MemberInviteCodes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_ExpiresAt",
                table: "MemberInviteCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_MemberInviteCodes_MembershipTypeId",
                table: "MemberInviteCodes",
                column: "MembershipTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberLoginTrackings_MemberId_LoginTimestamp",
                table: "MemberLoginTrackings",
                columns: new[] { "MemberId", "LoginTimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberLoginTrackings_Platform",
                table: "MemberLoginTrackings",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_MemberLoginTrackings_SessionId",
                table: "MemberLoginTrackings",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_ClubId_Email",
                table: "Members",
                columns: new[] { "ClubId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Members_InviteCodeId",
                table: "Members",
                column: "InviteCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_LocationId",
                table: "Members",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_MembershipTypeId",
                table: "Members",
                column: "MembershipTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegmentCache_MemberId",
                table: "MemberSegmentCache",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegmentCache_SegmentId",
                table: "MemberSegmentCache",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegmentHistory_ChangedByUserId",
                table: "MemberSegmentHistory",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegmentHistory_MemberId",
                table: "MemberSegmentHistory",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegmentHistory_SegmentId",
                table: "MemberSegmentHistory",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegments_ClubId",
                table: "MemberSegments",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberSegments_CreatedByUserId",
                table: "MemberSegments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MembershipTypes_ClubId_Name",
                table: "MembershipTypes",
                columns: new[] { "ClubId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberTagAssignments_AssignedByUserId",
                table: "MemberTagAssignments",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTagAssignments_MemberId",
                table: "MemberTagAssignments",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTagAssignments_TagId",
                table: "MemberTagAssignments",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTags_ClubId",
                table: "MemberTags",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTags_CreatedByUserId",
                table: "MemberTags",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_ApprovedBy",
                table: "MemberTransfers",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_FromLocationId",
                table: "MemberTransfers",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_MemberId",
                table: "MemberTransfers",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_RequestedAt",
                table: "MemberTransfers",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_RequestedBy",
                table: "MemberTransfers",
                column: "RequestedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_Status",
                table: "MemberTransfers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MemberTransfers_ToLocationId",
                table: "MemberTransfers",
                column: "ToLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_MultiSessionEventRegistrations_MemberId",
                table: "MultiSessionEventRegistrations",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MultiSessionEventRegistrations_MultiSessionEventId",
                table: "MultiSessionEventRegistrations",
                column: "MultiSessionEventId");

            migrationBuilder.CreateIndex(
                name: "IX_MultiSessionEvents_ClubId",
                table: "MultiSessionEvents",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_ExpiresAt",
                table: "PasswordResetTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                table: "PasswordResetTokens",
                column: "TokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ClubId_MemberId",
                table: "Payments",
                columns: new[] { "ClubId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MemberId",
                table: "Payments",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentDate",
                table: "Payments",
                column: "PaymentDate");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTokens_ClubId_MemberId",
                table: "PaymentTokens",
                columns: new[] { "ClubId", "MemberId" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTokens_ExpiresAt",
                table: "PaymentTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTokens_MemberId",
                table: "PaymentTokens",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTokens_Token",
                table: "PaymentTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PersonalizationTokens_ClubId",
                table: "PersonalizationTokens",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalizationTokens_CreatedByUserId",
                table: "PersonalizationTokens",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProfileCompletenessTrackings_CalculatedAt",
                table: "ProfileCompletenessTrackings",
                column: "CalculatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProfileCompletenessTrackings_CompletionPercentage",
                table: "ProfileCompletenessTrackings",
                column: "CompletionPercentage");

            migrationBuilder.CreateIndex(
                name: "IX_ProfileCompletenessTrackings_MemberId",
                table: "ProfileCompletenessTrackings",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_IsActive_IsAutoApply",
                table: "Promotions",
                columns: new[] { "IsActive", "IsAutoApply" });

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_PromoCode",
                table: "Promotions",
                column: "PromoCode");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_StripeCouponId",
                table: "Promotions",
                column: "StripeCouponId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodeScans_IsSuccessful",
                table: "QRCodeScans",
                column: "IsSuccessful");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodeScans_MemberId",
                table: "QRCodeScans",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodeScans_QRCodeId",
                table: "QRCodeScans",
                column: "QRCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodeScans_ScannedAt",
                table: "QRCodeScans",
                column: "ScannedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistories_ExecutedAt",
                table: "ReportExecutionHistories",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistories_ScheduleId",
                table: "ReportExecutionHistories",
                column: "ScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistories_ScheduleId_ExecutedAt",
                table: "ReportExecutionHistories",
                columns: new[] { "ScheduleId", "ExecutedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistories_Status",
                table: "ReportExecutionHistories",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RsvpTokens_EventId",
                table: "RsvpTokens",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_RsvpTokens_ExpiresAt",
                table: "RsvpTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RsvpTokens_MemberId_EventId",
                table: "RsvpTokens",
                columns: new[] { "MemberId", "EventId" });

            migrationBuilder.CreateIndex(
                name: "IX_RsvpTokens_TokenValue",
                table: "RsvpTokens",
                column: "TokenValue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledReports_ClubId",
                table: "ScheduledReports",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledReports_ClubId_IsActive",
                table: "ScheduledReports",
                columns: new[] { "ClubId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledReports_IsActive",
                table: "ScheduledReports",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledReports_NextRunDate",
                table: "ScheduledReports",
                column: "NextRunDate");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_AddedAt",
                table: "SegmentMembers",
                column: "AddedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_AddedBy",
                table: "SegmentMembers",
                column: "AddedBy");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_MemberId",
                table: "SegmentMembers",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_SegmentId",
                table: "SegmentMembers",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_ClubId",
                table: "SMSMessages",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_CommunicationId",
                table: "SMSMessages",
                column: "CommunicationId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_MemberId",
                table: "SMSMessages",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_SentByUserId",
                table: "SMSMessages",
                column: "SentByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveyQuestions_SurveyId",
                table: "SurveyQuestions",
                column: "SurveyId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveyResponses_FeedbackResponseId",
                table: "SurveyResponses",
                column: "FeedbackResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveyResponses_QuestionId",
                table: "SurveyResponses",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDeviceTokens_DeviceType",
                table: "UserDeviceTokens",
                column: "DeviceType");

            migrationBuilder.CreateIndex(
                name: "IX_UserDeviceTokens_UserId",
                table: "UserDeviceTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDeviceTokens_UserId_DeviceToken",
                table: "UserDeviceTokens",
                columns: new[] { "UserId", "DeviceToken" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_ActivationToken",
                table: "Users",
                column: "ActivationToken");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertConfigurations");

            migrationBuilder.DropTable(
                name: "AnalyticsEvents");

            migrationBuilder.DropTable(
                name: "AppFeedback");

            migrationBuilder.DropTable(
                name: "ClubAdminInvites");

            migrationBuilder.DropTable(
                name: "ClubAdmins");

            migrationBuilder.DropTable(
                name: "ClubBrandings");

            migrationBuilder.DropTable(
                name: "ClubChatMessages");

            migrationBuilder.DropTable(
                name: "ClubCustomFields");

            migrationBuilder.DropTable(
                name: "ClubEmailUsage");

            migrationBuilder.DropTable(
                name: "CommunicationAnalytics");

            migrationBuilder.DropTable(
                name: "ErrorLogs");

            migrationBuilder.DropTable(
                name: "EventAnalyticsMetrics");

            migrationBuilder.DropTable(
                name: "EventAttendances");

            migrationBuilder.DropTable(
                name: "EventCheckins");

            migrationBuilder.DropTable(
                name: "EventEngagementScoringRules");

            migrationBuilder.DropTable(
                name: "EventEngagementTrackings");

            migrationBuilder.DropTable(
                name: "EventEngagementTrends");

            migrationBuilder.DropTable(
                name: "EventFeedbackAnalyses");

            migrationBuilder.DropTable(
                name: "EventFeedbacks");

            migrationBuilder.DropTable(
                name: "EventRecommendations");

            migrationBuilder.DropTable(
                name: "EventRsvps");

            migrationBuilder.DropTable(
                name: "EventSessionAttendances");

            migrationBuilder.DropTable(
                name: "EventSessionRegistrations");

            migrationBuilder.DropTable(
                name: "EventWaitlists");

            migrationBuilder.DropTable(
                name: "ExternalAuthProviders");

            migrationBuilder.DropTable(
                name: "FeatureUsageEvents");

            migrationBuilder.DropTable(
                name: "LocationAdmins");

            migrationBuilder.DropTable(
                name: "LocationBrandings");

            migrationBuilder.DropTable(
                name: "MarketingLeads");

            migrationBuilder.DropTable(
                name: "MemberCustomFieldValues");

            migrationBuilder.DropTable(
                name: "MemberEngagementAlerts");

            migrationBuilder.DropTable(
                name: "MemberEngagementHistories");

            migrationBuilder.DropTable(
                name: "MemberEventEngagementScores");

            migrationBuilder.DropTable(
                name: "MemberEventQRCodes");

            migrationBuilder.DropTable(
                name: "MemberImports");

            migrationBuilder.DropTable(
                name: "MemberLoginTrackings");

            migrationBuilder.DropTable(
                name: "MemberSegmentCache");

            migrationBuilder.DropTable(
                name: "MemberSegmentHistory");

            migrationBuilder.DropTable(
                name: "MemberTagAssignments");

            migrationBuilder.DropTable(
                name: "MemberTransfers");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentTokens");

            migrationBuilder.DropTable(
                name: "PersonalizationTokens");

            migrationBuilder.DropTable(
                name: "ProfileCompletenessTrackings");

            migrationBuilder.DropTable(
                name: "QRCodeScans");

            migrationBuilder.DropTable(
                name: "ReportExecutionHistories");

            migrationBuilder.DropTable(
                name: "RsvpTokens");

            migrationBuilder.DropTable(
                name: "SegmentFilterTemplates");

            migrationBuilder.DropTable(
                name: "SegmentMembers");

            migrationBuilder.DropTable(
                name: "SMSMessages");

            migrationBuilder.DropTable(
                name: "SurveyResponses");

            migrationBuilder.DropTable(
                name: "UserDeviceTokens");

            migrationBuilder.DropTable(
                name: "EventSessions");

            migrationBuilder.DropTable(
                name: "MultiSessionEventRegistrations");

            migrationBuilder.DropTable(
                name: "AnalyticsSessions");

            migrationBuilder.DropTable(
                name: "MemberActivitySessions");

            migrationBuilder.DropTable(
                name: "MemberCustomFields");

            migrationBuilder.DropTable(
                name: "MemberTags");

            migrationBuilder.DropTable(
                name: "EventQRCodes");

            migrationBuilder.DropTable(
                name: "ScheduledReports");

            migrationBuilder.DropTable(
                name: "CommunicationsLogs");

            migrationBuilder.DropTable(
                name: "EventFeedbackResponses");

            migrationBuilder.DropTable(
                name: "SurveyQuestions");

            migrationBuilder.DropTable(
                name: "MultiSessionEvents");

            migrationBuilder.DropTable(
                name: "MemberEngagementScores");

            migrationBuilder.DropTable(
                name: "ABTestCampaigns");

            migrationBuilder.DropTable(
                name: "CommunicationWorkflows");

            migrationBuilder.DropTable(
                name: "EventFeedbackSurveys");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "MemberSegments");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "MemberInviteCodes");

            migrationBuilder.DropTable(
                name: "ClubLocations");

            migrationBuilder.DropTable(
                name: "EventSeries");

            migrationBuilder.DropTable(
                name: "MembershipTypes");

            migrationBuilder.DropTable(
                name: "Clubs");

            migrationBuilder.DropTable(
                name: "Promotions");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
