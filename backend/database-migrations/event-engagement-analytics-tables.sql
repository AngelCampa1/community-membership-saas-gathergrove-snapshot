-- Event Engagement Analytics System Database Migration
-- Creates comprehensive tables for event engagement tracking and analysis
-- Integrates with existing MemberEngagementScores infrastructure

-- ========================================
-- 1. Event Engagement Tracking (Main Table)
-- ========================================
CREATE TABLE EventEngagementTracking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL,
    MemberId INT NOT NULL,
    
    -- Registration & Attendance
    RegistrationStatus NVARCHAR(20) NOT NULL DEFAULT 'registered' 
        CHECK (RegistrationStatus IN ('registered', 'waitlisted', 'cancelled', 'no_show')),
    AttendanceStatus NVARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (AttendanceStatus IN ('pending', 'attended', 'partial', 'absent', 'late_arrival', 'early_departure')),
    AttendancePercentage DECIMAL(5,2) NOT NULL DEFAULT 0 
        CHECK (AttendancePercentage >= 0 AND AttendancePercentage <= 100),
    
    -- Engagement Metrics
    CheckInTimestamp DATETIME2 NULL,
    CheckOutTimestamp DATETIME2 NULL,
    SessionDurationMinutes INT NULL,
    InteractionCount INT NOT NULL DEFAULT 0, -- Questions, polls, chat messages
    NetworkingConnections INT NOT NULL DEFAULT 0, -- New connections made
    
    -- Participation Levels
    ParticipationLevel NVARCHAR(20) NOT NULL DEFAULT 'passive'
        CHECK (ParticipationLevel IN ('highly_active', 'active', 'moderate', 'passive', 'disengaged')),
    ParticipationScore DECIMAL(5,2) NOT NULL DEFAULT 0 
        CHECK (ParticipationScore >= 0 AND ParticipationScore <= 100),
    
    -- Event-Specific Engagement
    QuestionsAsked INT NOT NULL DEFAULT 0,
    PollsParticipated INT NOT NULL DEFAULT 0,
    ResourcesDownloaded INT NOT NULL DEFAULT 0,
    ChatMessages INT NOT NULL DEFAULT 0,
    BreakoutParticipation BIT NOT NULL DEFAULT 0,
    
    -- Technology Usage
    Platform NVARCHAR(20) NOT NULL DEFAULT 'web' 
        CHECK (Platform IN ('web', 'mobile', 'desktop_app', 'phone')),
    DeviceType NVARCHAR(20) NULL,
    ConnectionQuality NVARCHAR(20) NULL 
        CHECK (ConnectionQuality IS NULL OR ConnectionQuality IN ('excellent', 'good', 'fair', 'poor')),
    TechnicalIssues BIT NOT NULL DEFAULT 0,
    
    -- Behavioral Analytics
    FocusScore DECIMAL(5,2) NULL CHECK (FocusScore IS NULL OR (FocusScore >= 0 AND FocusScore <= 100)),
    AttentionSpan INT NULL, -- Minutes of active engagement
    MultitaskingDetected BIT NOT NULL DEFAULT 0,
    
    -- Feedback Integration
    PostEventSurveyCompleted BIT NOT NULL DEFAULT 0,
    SatisfactionRating DECIMAL(3,1) NULL CHECK (SatisfactionRating IS NULL OR (SatisfactionRating >= 1.0 AND SatisfactionRating <= 5.0)),
    NetPromoterScore INT NULL CHECK (NetPromoterScore IS NULL OR (NetPromoterScore >= 0 AND NetPromoterScore <= 10)),
    
    -- Impact on Member Engagement
    EngagementBoost DECIMAL(6,2) NOT NULL DEFAULT 0, -- Impact on overall engagement score
    LastEngagementUpdate DATETIME2 NULL,
    
    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_EventEngagementTracking_Events FOREIGN KEY (EventId) 
        REFERENCES Events(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EventEngagementTracking_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one record per member per event
    CONSTRAINT UQ_EventEngagementTracking_EventMember UNIQUE (EventId, MemberId)
);

-- Indexes for performance
CREATE INDEX IX_EventEngagementTracking_Event_Attendance ON EventEngagementTracking(EventId, AttendanceStatus);
CREATE INDEX IX_EventEngagementTracking_Member_ParticipationScore ON EventEngagementTracking(MemberId, ParticipationScore);
CREATE INDEX IX_EventEngagementTracking_ParticipationLevel ON EventEngagementTracking(ParticipationLevel);
CREATE INDEX IX_EventEngagementTracking_EngagementBoost ON EventEngagementTracking(EngagementBoost);
CREATE INDEX IX_EventEngagementTracking_CreatedAt ON EventEngagementTracking(CreatedAt);

-- ========================================
-- 2. Event Analytics Metrics
-- ========================================
CREATE TABLE EventAnalyticsMetrics (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL,
    ClubId INT NOT NULL,
    
    -- Overall Event Metrics
    TotalRegistrations INT NOT NULL DEFAULT 0,
    TotalAttendees INT NOT NULL DEFAULT 0,
    AttendanceRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (AttendanceRate >= 0 AND AttendanceRate <= 100),
    NoShowRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (NoShowRate >= 0 AND NoShowRate <= 100),
    
    -- Engagement Metrics
    AverageParticipationScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (AverageParticipationScore >= 0 AND AverageParticipationScore <= 100),
    AverageSessionDuration INT NOT NULL DEFAULT 0, -- Minutes
    TotalInteractions INT NOT NULL DEFAULT 0,
    UniqueParticipants INT NOT NULL DEFAULT 0,
    
    -- Satisfaction Metrics
    AverageSatisfactionRating DECIMAL(3,1) NULL CHECK (AverageSatisfactionRating IS NULL OR (AverageSatisfactionRating >= 1.0 AND AverageSatisfactionRating <= 5.0)),
    AverageNPS DECIMAL(4,1) NULL CHECK (AverageNPS IS NULL OR (AverageNPS >= 0 AND AverageNPS <= 10)),
    SurveyResponseRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (SurveyResponseRate >= 0 AND SurveyResponseRate <= 100),
    
    -- Participation Distribution
    HighlyActiveCount INT NOT NULL DEFAULT 0,
    ActiveCount INT NOT NULL DEFAULT 0,
    ModerateCount INT NOT NULL DEFAULT 0,
    PassiveCount INT NOT NULL DEFAULT 0,
    DisengagedCount INT NOT NULL DEFAULT 0,
    
    -- Technology Metrics
    MobileUsagePercentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (MobileUsagePercentage >= 0 AND MobileUsagePercentage <= 100),
    TechnicalIssuesCount INT NOT NULL DEFAULT 0,
    
    -- Follow-up Metrics
    NetworkingConnectionsMade INT NOT NULL DEFAULT 0,
    ResourceDownloads INT NOT NULL DEFAULT 0,
    FollowUpEngagements INT NOT NULL DEFAULT 0,
    
    -- Member Engagement Impact
    TotalEngagementBoost DECIMAL(8,2) NOT NULL DEFAULT 0,
    AverageEngagementBoost DECIMAL(6,2) NOT NULL DEFAULT 0,
    MembersWithBoost INT NOT NULL DEFAULT 0,
    
    -- Comparison Metrics
    ComparedToClubAverage DECIMAL(6,2) NULL, -- Percentage difference from club average
    ComparedToEventType DECIMAL(6,2) NULL, -- Percentage difference from event type average
    EventSuccessScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (EventSuccessScore >= 0 AND EventSuccessScore <= 100),
    
    -- Timestamps
    CalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_EventAnalyticsMetrics_Events FOREIGN KEY (EventId) 
        REFERENCES Events(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EventAnalyticsMetrics_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one record per event
    CONSTRAINT UQ_EventAnalyticsMetrics_Event UNIQUE (EventId)
);

-- Indexes for analytics queries
CREATE INDEX IX_EventAnalyticsMetrics_Club_CalculatedAt ON EventAnalyticsMetrics(ClubId, CalculatedAt);
CREATE INDEX IX_EventAnalyticsMetrics_EventSuccessScore ON EventAnalyticsMetrics(EventSuccessScore);
CREATE INDEX IX_EventAnalyticsMetrics_AttendanceRate ON EventAnalyticsMetrics(AttendanceRate);
CREATE INDEX IX_EventAnalyticsMetrics_AverageParticipationScore ON EventAnalyticsMetrics(AverageParticipationScore);

-- ========================================
-- 3. Event Engagement Scoring Rules
-- ========================================
CREATE TABLE EventEngagementScoringRules (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClubId INT NOT NULL,
    
    -- Rule Configuration
    RuleName NVARCHAR(100) NOT NULL,
    EventType NVARCHAR(50) NULL, -- NULL means applies to all event types
    IsActive BIT NOT NULL DEFAULT 1,
    Priority INT NOT NULL DEFAULT 1, -- Higher number = higher priority
    
    -- Scoring Weights (must sum to 100)
    AttendanceWeight DECIMAL(5,2) NOT NULL DEFAULT 30.0 CHECK (AttendanceWeight >= 0 AND AttendanceWeight <= 100),
    ParticipationWeight DECIMAL(5,2) NOT NULL DEFAULT 25.0 CHECK (ParticipationWeight >= 0 AND ParticipationWeight <= 100),
    InteractionWeight DECIMAL(5,2) NOT NULL DEFAULT 20.0 CHECK (InteractionWeight >= 0 AND InteractionWeight <= 100),
    SatisfactionWeight DECIMAL(5,2) NOT NULL DEFAULT 15.0 CHECK (SatisfactionWeight >= 0 AND SatisfactionWeight <= 100),
    NetworkingWeight DECIMAL(5,2) NOT NULL DEFAULT 10.0 CHECK (NetworkingWeight >= 0 AND NetworkingWeight <= 100),
    
    -- Bonus Multipliers
    EarlyRegistrationBonus DECIMAL(4,2) NOT NULL DEFAULT 1.1 CHECK (EarlyRegistrationBonus >= 1.0 AND EarlyRegistrationBonus <= 2.0),
    PerfectAttendanceBonus DECIMAL(4,2) NOT NULL DEFAULT 1.2 CHECK (PerfectAttendanceBonus >= 1.0 AND PerfectAttendanceBonus <= 2.0),
    HighParticipationBonus DECIMAL(4,2) NOT NULL DEFAULT 1.15 CHECK (HighParticipationBonus >= 1.0 AND HighParticipationBonus <= 2.0),
    
    -- Penalty Multipliers
    NoShowPenalty DECIMAL(4,2) NOT NULL DEFAULT 0.5 CHECK (NoShowPenalty >= 0.0 AND NoShowPenalty <= 1.0),
    LatePenalty DECIMAL(4,2) NOT NULL DEFAULT 0.9 CHECK (LatePenalty >= 0.0 AND LatePenalty <= 1.0),
    EarlyDeparturePenalty DECIMAL(4,2) NOT NULL DEFAULT 0.8 CHECK (EarlyDeparturePenalty >= 0.0 AND EarlyDeparturePenalty <= 1.0),
    
    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId INT NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT FK_EventEngagementScoringRules_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EventEngagementScoringRules_CreatedByUser FOREIGN KEY (CreatedByUserId) 
        REFERENCES Users(Id) ON DELETE NO ACTION,
    
    -- Constraint to ensure weights sum to 100
    CONSTRAINT CK_EventEngagementScoringRules_WeightSum 
        CHECK ((AttendanceWeight + ParticipationWeight + InteractionWeight + SatisfactionWeight + NetworkingWeight) = 100.0)
);

-- Indexes for rule lookup
CREATE INDEX IX_EventEngagementScoringRules_Club_EventType ON EventEngagementScoringRules(ClubId, EventType, IsActive);
CREATE INDEX IX_EventEngagementScoringRules_Priority ON EventEngagementScoringRules(Priority DESC);

-- ========================================
-- 4. Event Recommendation Engine
-- ========================================
CREATE TABLE EventRecommendations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    EventId INT NOT NULL,
    
    -- Recommendation Scoring
    RecommendationScore DECIMAL(5,2) NOT NULL CHECK (RecommendationScore >= 0 AND RecommendationScore <= 100),
    ConfidenceLevel DECIMAL(5,2) NOT NULL CHECK (ConfidenceLevel >= 0 AND ConfidenceLevel <= 100),
    
    -- Recommendation Factors (JSON for detailed breakdown)
    RecommendationFactors NTEXT NOT NULL DEFAULT '{}',
    
    -- Reason Categories
    PastEngagementFactor DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (PastEngagementFactor >= 0 AND PastEngagementFactor <= 100),
    InterestAlignmentFactor DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (InterestAlignmentFactor >= 0 AND InterestAlignmentFactor <= 100),
    SocialConnectionsFactor DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (SocialConnectionsFactor >= 0 AND SocialConnectionsFactor <= 100),
    TimingPreferenceFactor DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (TimingPreferenceFactor >= 0 AND TimingPreferenceFactor <= 100),
    DiversityFactor DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (DiversityFactor >= 0 AND DiversityFactor <= 100),
    
    -- Status Tracking
    Status NVARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (Status IN ('active', 'presented', 'registered', 'declined', 'expired')),
    PresentedAt DATETIME2 NULL,
    ResponseAt DATETIME2 NULL,
    
    -- A/B Testing
    TestGroup NVARCHAR(10) NULL CHECK (TestGroup IS NULL OR TestGroup IN ('A', 'B', 'control')),
    RecommendationMethod NVARCHAR(50) NOT NULL DEFAULT 'algorithm_v1',
    
    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2 NOT NULL, -- Recommendations should expire
    
    -- Foreign Keys
    CONSTRAINT FK_EventRecommendations_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EventRecommendations_Events FOREIGN KEY (EventId) 
        REFERENCES Events(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one active recommendation per member per event
    CONSTRAINT UQ_EventRecommendations_ActiveMemberEvent UNIQUE (MemberId, EventId, Status)
);

-- Indexes for recommendation queries
CREATE INDEX IX_EventRecommendations_Member_Score ON EventRecommendations(MemberId, RecommendationScore DESC, Status);
CREATE INDEX IX_EventRecommendations_Status_CreatedAt ON EventRecommendations(Status, CreatedAt);
CREATE INDEX IX_EventRecommendations_ExpiresAt ON EventRecommendations(ExpiresAt);

-- ========================================
-- 5. Event Engagement Trends
-- ========================================
CREATE TABLE EventEngagementTrends (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClubId INT NOT NULL,
    
    -- Time Period
    TrendPeriod NVARCHAR(20) NOT NULL CHECK (TrendPeriod IN ('daily', 'weekly', 'monthly', 'quarterly')),
    PeriodStart DATE NOT NULL,
    PeriodEnd DATE NOT NULL,
    
    -- Event Metrics
    TotalEvents INT NOT NULL DEFAULT 0,
    AverageAttendance DECIMAL(8,2) NOT NULL DEFAULT 0,
    AverageAttendanceRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (AverageAttendanceRate >= 0 AND AverageAttendanceRate <= 100),
    
    -- Engagement Metrics
    AverageEngagementScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (AverageEngagementScore >= 0 AND AverageEngagementScore <= 100),
    TotalEngagementBoost DECIMAL(10,2) NOT NULL DEFAULT 0,
    ActiveMemberCount INT NOT NULL DEFAULT 0,
    
    -- Satisfaction Metrics
    AverageSatisfaction DECIMAL(3,1) NULL CHECK (AverageSatisfaction IS NULL OR (AverageSatisfaction >= 1.0 AND AverageSatisfaction <= 5.0)),
    AverageNPS DECIMAL(4,1) NULL CHECK (AverageNPS IS NULL OR (AverageNPS >= 0 AND AverageNPS <= 10)),
    
    -- Growth Metrics
    NewMemberEventAttendance INT NOT NULL DEFAULT 0,
    MemberRetentionRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (MemberRetentionRate >= 0 AND MemberRetentionRate <= 100),
    RepeatAttendanceRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (RepeatAttendanceRate >= 0 AND RepeatAttendanceRate <= 100),
    
    -- Comparison Metrics
    GrowthRate DECIMAL(6,2) NOT NULL DEFAULT 0, -- Percentage change from previous period
    TrendDirection NVARCHAR(10) NOT NULL DEFAULT 'stable' CHECK (TrendDirection IN ('up', 'down', 'stable')),
    
    -- Insights (JSON for detailed analysis)
    TrendInsights NTEXT NOT NULL DEFAULT '{}',
    
    -- Timestamps
    CalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_EventEngagementTrends_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one record per club per period
    CONSTRAINT UQ_EventEngagementTrends_ClubPeriod UNIQUE (ClubId, TrendPeriod, PeriodStart)
);

-- Indexes for trend analysis
CREATE INDEX IX_EventEngagementTrends_Club_Period ON EventEngagementTrends(ClubId, TrendPeriod, PeriodStart);
CREATE INDEX IX_EventEngagementTrends_GrowthRate ON EventEngagementTrends(GrowthRate);
CREATE INDEX IX_EventEngagementTrends_TrendDirection ON EventEngagementTrends(TrendDirection);

-- ========================================
-- 6. Member Event Engagement Scores
-- ========================================
CREATE TABLE MemberEventEngagementScores (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Overall Event Engagement Metrics
    TotalEventsAttended INT NOT NULL DEFAULT 0,
    EventAttendanceRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (EventAttendanceRate >= 0 AND EventAttendanceRate <= 100),
    AverageEventEngagementScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (AverageEventEngagementScore >= 0 AND AverageEventEngagementScore <= 100),
    
    -- Event Participation Patterns
    PreferredEventTypes NTEXT NOT NULL DEFAULT '[]', -- JSON array of preferred event types
    PreferredEventTimes NVARCHAR(100) NULL, -- JSON for time preferences
    ConsistencyScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (ConsistencyScore >= 0 AND ConsistencyScore <= 100),
    
    -- Engagement Quality Metrics
    HighEngagementEventsCount INT NOT NULL DEFAULT 0,
    LowEngagementEventsCount INT NOT NULL DEFAULT 0,
    AverageSatisfactionRating DECIMAL(3,1) NULL CHECK (AverageSatisfactionRating IS NULL OR (AverageSatisfactionRating >= 1.0 AND AverageSatisfactionRating <= 5.0)),
    
    -- Social Engagement
    NetworkingScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (NetworkingScore >= 0 AND NetworkingScore <= 100),
    PeerInfluenceScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (PeerInfluenceScore >= 0 AND PeerInfluenceScore <= 100),
    CommunityContribution DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (CommunityContribution >= 0 AND CommunityContribution <= 100),
    
    -- Predictive Metrics
    EventRetentionProbability DECIMAL(5,2) NOT NULL DEFAULT 50.0 CHECK (EventRetentionProbability >= 0 AND EventRetentionProbability <= 100),
    EngagementTrend NVARCHAR(10) NOT NULL DEFAULT 'stable' CHECK (EngagementTrend IN ('improving', 'declining', 'stable')),
    RiskLevel NVARCHAR(10) NOT NULL DEFAULT 'low' CHECK (RiskLevel IN ('low', 'medium', 'high')),
    
    -- Rolling Window Metrics (Last 90 days)
    Recent90DayEvents INT NOT NULL DEFAULT 0,
    Recent90DayEngagementScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (Recent90DayEngagementScore >= 0 AND Recent90DayEngagementScore <= 100),
    Recent90DayTrend DECIMAL(6,2) NOT NULL DEFAULT 0, -- Percentage change
    
    -- Integration with Main Engagement Score
    ContributionToOverallScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (ContributionToOverallScore >= 0 AND ContributionToOverallScore <= 100),
    LastEngagementScoreUpdate DATETIME2 NULL,
    
    -- Timestamps
    CalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_MemberEventEngagementScores_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one record per member
    CONSTRAINT UQ_MemberEventEngagementScores_Member UNIQUE (MemberId)
);

-- Indexes for member event engagement queries
CREATE INDEX IX_MemberEventEngagementScores_EngagementScore ON MemberEventEngagementScores(AverageEventEngagementScore);
CREATE INDEX IX_MemberEventEngagementScores_RiskLevel ON MemberEventEngagementScores(RiskLevel);
CREATE INDEX IX_MemberEventEngagementScores_EngagementTrend ON MemberEventEngagementScores(EngagementTrend);
CREATE INDEX IX_MemberEventEngagementScores_CalculatedAt ON MemberEventEngagementScores(CalculatedAt);

-- ========================================
-- 7. Event Feedback and Sentiment Analysis
-- ========================================
CREATE TABLE EventFeedbackAnalysis (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL,
    MemberId INT NOT NULL,
    
    -- Survey Response Data
    SurveyResponseId NVARCHAR(50) NULL, -- External survey system ID
    OverallSatisfaction DECIMAL(3,1) NOT NULL CHECK (OverallSatisfaction >= 1.0 AND OverallSatisfaction <= 5.0),
    NetPromoterScore INT NOT NULL CHECK (NetPromoterScore >= 0 AND NetPromoterScore <= 10),
    
    -- Detailed Ratings
    ContentQualityRating DECIMAL(3,1) NULL CHECK (ContentQualityRating IS NULL OR (ContentQualityRating >= 1.0 AND ContentQualityRating <= 5.0)),
    PresentationRating DECIMAL(3,1) NULL CHECK (PresentationRating IS NULL OR (PresentationRating >= 1.0 AND PresentationRating <= 5.0)),
    OrganizationRating DECIMAL(3,1) NULL CHECK (OrganizationRating IS NULL OR (OrganizationRating >= 1.0 AND OrganizationRating <= 5.0)),
    NetworkingRating DECIMAL(3,1) NULL CHECK (NetworkingRating IS NULL OR (NetworkingRating >= 1.0 AND NetworkingRating <= 5.0)),
    TechnologyRating DECIMAL(3,1) NULL CHECK (TechnologyRating IS NULL OR (TechnologyRating >= 1.0 AND TechnologyRating <= 5.0)),
    
    -- Text Feedback
    PositiveFeedback NTEXT NULL,
    NegativeFeedback NTEXT NULL,
    Suggestions NTEXT NULL,
    
    -- Sentiment Analysis (if implemented)
    SentimentScore DECIMAL(4,2) NULL CHECK (SentimentScore IS NULL OR (SentimentScore >= -1.0 AND SentimentScore <= 1.0)),
    SentimentLabel NVARCHAR(20) NULL CHECK (SentimentLabel IS NULL OR SentimentLabel IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
    KeyTopics NTEXT NOT NULL DEFAULT '[]', -- JSON array of identified topics
    
    -- Engagement Impact
    WillAttendFutureEvents BIT NULL,
    WouldRecommendToOthers BIT NULL,
    EngagementMotivation NVARCHAR(20) NULL CHECK (EngagementMotivation IS NULL OR EngagementMotivation IN ('increased', 'maintained', 'decreased')),
    
    -- Response Metadata
    ResponseDuration INT NULL, -- Seconds to complete survey
    ResponseCompleteness DECIMAL(5,2) NOT NULL DEFAULT 100.0 CHECK (ResponseCompleteness >= 0 AND ResponseCompleteness <= 100),
    
    -- Timestamps
    ResponseDate DATETIME2 NOT NULL,
    ProcessedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_EventFeedbackAnalysis_Events FOREIGN KEY (EventId) 
        REFERENCES Events(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EventFeedbackAnalysis_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    
    -- Unique constraint for one feedback per member per event
    CONSTRAINT UQ_EventFeedbackAnalysis_EventMember UNIQUE (EventId, MemberId)
);

-- Indexes for feedback analysis
CREATE INDEX IX_EventFeedbackAnalysis_Event_Satisfaction ON EventFeedbackAnalysis(EventId, OverallSatisfaction);
CREATE INDEX IX_EventFeedbackAnalysis_NPS ON EventFeedbackAnalysis(NetPromoterScore);
CREATE INDEX IX_EventFeedbackAnalysis_SentimentScore ON EventFeedbackAnalysis(SentimentScore);
CREATE INDEX IX_EventFeedbackAnalysis_ResponseDate ON EventFeedbackAnalysis(ResponseDate);

-- ========================================
-- 8. Integration Views
-- ========================================

-- Comprehensive event engagement view
CREATE VIEW vw_EventEngagementOverview AS
SELECT 
    e.Id as EventId,
    e.Title as EventTitle,
    e.EventDate,
    e.ClubId,
    eet.AttendanceStatus,
    eet.ParticipationLevel,
    eet.ParticipationScore,
    eet.InteractionCount,
    eet.SessionDurationMinutes,
    eet.SatisfactionRating,
    eet.EngagementBoost,
    m.Id as MemberId,
    m.FullName as MemberName,
    mes.OverallScore as MemberEngagementScore,
    mes.Level as MemberEngagementLevel,
    CASE 
        WHEN eet.ParticipationScore >= 80 THEN 'highly_engaged'
        WHEN eet.ParticipationScore >= 60 THEN 'engaged'
        WHEN eet.ParticipationScore >= 40 THEN 'moderate'
        WHEN eet.ParticipationScore >= 20 THEN 'low'
        ELSE 'disengaged'
    END as EngagementCategory
FROM Events e
LEFT JOIN EventEngagementTracking eet ON e.Id = eet.EventId
LEFT JOIN Members m ON eet.MemberId = m.Id
LEFT JOIN MemberEngagementScores mes ON m.Id = mes.MemberId
WHERE m.Status = 'Active';

-- Member event engagement summary view
CREATE VIEW vw_MemberEventEngagementSummary AS
SELECT 
    m.Id as MemberId,
    m.FullName,
    m.ClubId,
    COUNT(eet.Id) as TotalEventsParticipated,
    AVG(eet.ParticipationScore) as AverageParticipationScore,
    AVG(eet.SatisfactionRating) as AverageSatisfactionRating,
    SUM(eet.EngagementBoost) as TotalEngagementBoost,
    MAX(eet.CreatedAt) as LastEventParticipation,
    COUNT(CASE WHEN eet.AttendanceStatus = 'attended' THEN 1 END) as EventsAttended,
    COUNT(CASE WHEN eet.AttendanceStatus = 'no_show' THEN 1 END) as EventsNoShow,
    CASE 
        WHEN COUNT(eet.Id) > 0 THEN 
            (COUNT(CASE WHEN eet.AttendanceStatus = 'attended' THEN 1 END) * 100.0) / COUNT(eet.Id)
        ELSE 0
    END as AttendanceRate,
    mes.OverallScore as CurrentEngagementScore,
    mes.EventParticipationScore
FROM Members m
LEFT JOIN EventEngagementTracking eet ON m.Id = eet.MemberId
LEFT JOIN MemberEngagementScores mes ON m.Id = mes.MemberId
WHERE m.Status = 'Active'
GROUP BY m.Id, m.FullName, m.ClubId, mes.OverallScore, mes.EventParticipationScore;

-- Club event engagement dashboard view
CREATE VIEW vw_ClubEventEngagementDashboard AS
SELECT 
    c.Id as ClubId,
    c.Name as ClubName,
    COUNT(DISTINCT e.Id) as TotalEvents,
    COUNT(DISTINCT eet.MemberId) as UniqueAttendees,
    AVG(eam.AttendanceRate) as AverageAttendanceRate,
    AVG(eam.AverageParticipationScore) as AverageParticipationScore,
    AVG(eam.AverageSatisfactionRating) as AverageSatisfactionRating,
    AVG(eam.AverageNPS) as AverageNPS,
    SUM(eam.TotalEngagementBoost) as TotalEngagementBoost,
    COUNT(CASE WHEN eam.EventSuccessScore >= 80 THEN 1 END) as HighSuccessEvents,
    COUNT(CASE WHEN eam.EventSuccessScore < 60 THEN 1 END) as LowSuccessEvents
FROM Clubs c
LEFT JOIN Events e ON c.Id = e.ClubId
LEFT JOIN EventEngagementTracking eet ON e.Id = eet.EventId
LEFT JOIN EventAnalyticsMetrics eam ON e.Id = eam.EventId
WHERE e.EventDate >= DATEADD(MONTH, -12, GETUTCDATE()) -- Last 12 months
GROUP BY c.Id, c.Name;

-- ========================================
-- 9. Stored Procedures for Calculations
-- ========================================

-- Procedure to calculate event engagement scores
CREATE PROCEDURE sp_CalculateEventEngagementScore
    @EventId INT,
    @MemberId INT
AS
BEGIN
    DECLARE @AttendanceScore DECIMAL(5,2) = 0;
    DECLARE @ParticipationScore DECIMAL(5,2) = 0;
    DECLARE @InteractionScore DECIMAL(5,2) = 0;
    DECLARE @SatisfactionScore DECIMAL(5,2) = 0;
    DECLARE @NetworkingScore DECIMAL(5,2) = 0;
    DECLARE @FinalScore DECIMAL(5,2) = 0;
    
    -- Get scoring rules for the event
    DECLARE @AttendanceWeight DECIMAL(5,2), @ParticipationWeight DECIMAL(5,2);
    DECLARE @InteractionWeight DECIMAL(5,2), @SatisfactionWeight DECIMAL(5,2);
    DECLARE @NetworkingWeight DECIMAL(5,2);
    
    SELECT TOP 1 
        @AttendanceWeight = AttendanceWeight,
        @ParticipationWeight = ParticipationWeight,
        @InteractionWeight = InteractionWeight,
        @SatisfactionWeight = SatisfactionWeight,
        @NetworkingWeight = NetworkingWeight
    FROM EventEngagementScoringRules esr
    INNER JOIN Events e ON esr.ClubId = e.ClubId
    WHERE e.Id = @EventId 
        AND esr.IsActive = 1
        AND (esr.EventType IS NULL OR esr.EventType = e.EventType)
    ORDER BY esr.Priority DESC;
    
    -- Default weights if no rules found
    IF @AttendanceWeight IS NULL
    BEGIN
        SET @AttendanceWeight = 30.0;
        SET @ParticipationWeight = 25.0;
        SET @InteractionWeight = 20.0;
        SET @SatisfactionWeight = 15.0;
        SET @NetworkingWeight = 10.0;
    END
    
    -- Calculate component scores from EventEngagementTracking
    SELECT 
        @AttendanceScore = CASE 
            WHEN AttendanceStatus = 'attended' THEN AttendancePercentage
            WHEN AttendanceStatus = 'partial' THEN AttendancePercentage * 0.7
            WHEN AttendanceStatus = 'late_arrival' THEN AttendancePercentage * 0.8
            WHEN AttendanceStatus = 'early_departure' THEN AttendancePercentage * 0.6
            ELSE 0
        END,
        @InteractionScore = CASE 
            WHEN InteractionCount >= 10 THEN 100
            WHEN InteractionCount >= 5 THEN 80
            WHEN InteractionCount >= 2 THEN 60
            WHEN InteractionCount >= 1 THEN 40
            ELSE 20
        END,
        @NetworkingScore = CASE 
            WHEN NetworkingConnections >= 5 THEN 100
            WHEN NetworkingConnections >= 3 THEN 80
            WHEN NetworkingConnections >= 1 THEN 60
            ELSE 20
        END,
        @SatisfactionScore = CASE 
            WHEN SatisfactionRating IS NOT NULL THEN (SatisfactionRating - 1) * 25
            ELSE 50
        END
    FROM EventEngagementTracking
    WHERE EventId = @EventId AND MemberId = @MemberId;
    
    -- Get participation score (already calculated)
    SELECT @ParticipationScore = ISNULL(ParticipationScore, 0)
    FROM EventEngagementTracking
    WHERE EventId = @EventId AND MemberId = @MemberId;
    
    -- Calculate weighted final score
    SET @FinalScore = (
        (@AttendanceScore * @AttendanceWeight) +
        (@ParticipationScore * @ParticipationWeight) +
        (@InteractionScore * @InteractionWeight) +
        (@SatisfactionScore * @SatisfactionWeight) +
        (@NetworkingScore * @NetworkingWeight)
    ) / 100.0;
    
    -- Update the tracking record
    UPDATE EventEngagementTracking
    SET ParticipationScore = @FinalScore,
        EngagementBoost = (@FinalScore - 50) * 0.1, -- Boost formula
        UpdatedAt = GETUTCDATE()
    WHERE EventId = @EventId AND MemberId = @MemberId;
    
    RETURN @FinalScore;
END

-- ========================================
-- 10. Triggers for Automatic Updates
-- ========================================

-- Trigger to update member engagement scores when event engagement changes
CREATE TRIGGER TR_EventEngagementTracking_UpdateMemberScore
ON EventEngagementTracking
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the EventParticipationScore in MemberEngagementScores
    UPDATE mes
    SET 
        EventsAttendedCount = (
            SELECT COUNT(*)
            FROM EventEngagementTracking eet2
            WHERE eet2.MemberId = i.MemberId 
                AND eet2.AttendanceStatus = 'attended'
                AND eet2.CreatedAt >= DATEADD(DAY, -30, GETUTCDATE())
        ),
        EventParticipationScore = (
            SELECT ISNULL(AVG(eet2.ParticipationScore), 0)
            FROM EventEngagementTracking eet2
            WHERE eet2.MemberId = i.MemberId 
                AND eet2.AttendanceStatus = 'attended'
                AND eet2.CreatedAt >= DATEADD(DAY, -30, GETUTCDATE())
        ),
        LastActivity = CASE 
            WHEN i.CheckInTimestamp > mes.LastActivity THEN i.CheckInTimestamp
            ELSE mes.LastActivity
        END,
        UpdatedAt = GETUTCDATE()
    FROM MemberEngagementScores mes
    INNER JOIN inserted i ON mes.MemberId = i.MemberId;
    
    -- Create/update member event engagement scores
    MERGE MemberEventEngagementScores AS target
    USING (
        SELECT 
            i.MemberId,
            COUNT(*) as TotalEvents,
            AVG(i.ParticipationScore) as AvgScore,
            SUM(CASE WHEN i.ParticipationScore >= 80 THEN 1 ELSE 0 END) as HighEngagement,
            SUM(CASE WHEN i.ParticipationScore < 40 THEN 1 ELSE 0 END) as LowEngagement
        FROM inserted i
        INNER JOIN EventEngagementTracking eet ON i.EventId = eet.EventId AND i.MemberId = eet.MemberId
        WHERE eet.AttendanceStatus = 'attended'
        GROUP BY i.MemberId
    ) AS source ON target.MemberId = source.MemberId
    WHEN MATCHED THEN
        UPDATE SET 
            AverageEventEngagementScore = source.AvgScore,
            HighEngagementEventsCount = source.HighEngagement,
            LowEngagementEventsCount = source.LowEngagement,
            UpdatedAt = GETUTCDATE()
    WHEN NOT MATCHED THEN
        INSERT (MemberId, AverageEventEngagementScore, HighEngagementEventsCount, LowEngagementEventsCount)
        VALUES (source.MemberId, source.AvgScore, source.HighEngagement, source.LowEngagement);
END

-- Trigger to calculate event analytics when engagement data changes
CREATE TRIGGER TR_EventEngagementTracking_UpdateAnalytics
ON EventEngagementTracking
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get affected event IDs
    DECLARE @EventIds TABLE (EventId INT);
    INSERT INTO @EventIds (EventId)
    SELECT DISTINCT EventId FROM inserted
    UNION
    SELECT DISTINCT EventId FROM deleted;
    
    -- Update event analytics metrics
    MERGE EventAnalyticsMetrics AS target
    USING (
        SELECT 
            e.Id as EventId,
            e.ClubId,
            COUNT(eet.Id) as TotalRegistrations,
            SUM(CASE WHEN eet.AttendanceStatus = 'attended' THEN 1 ELSE 0 END) as TotalAttendees,
            CASE 
                WHEN COUNT(eet.Id) > 0 THEN 
                    (SUM(CASE WHEN eet.AttendanceStatus = 'attended' THEN 1 ELSE 0 END) * 100.0) / COUNT(eet.Id)
                ELSE 0
            END as AttendanceRate,
            AVG(eet.ParticipationScore) as AvgParticipationScore,
            AVG(eet.SessionDurationMinutes) as AvgSessionDuration,
            SUM(eet.InteractionCount) as TotalInteractions,
            AVG(eet.SatisfactionRating) as AvgSatisfactionRating,
            SUM(eet.EngagementBoost) as TotalEngagementBoost
        FROM Events e
        LEFT JOIN EventEngagementTracking eet ON e.Id = eet.EventId
        WHERE e.Id IN (SELECT EventId FROM @EventIds)
        GROUP BY e.Id, e.ClubId
    ) AS source ON target.EventId = source.EventId
    WHEN MATCHED THEN
        UPDATE SET 
            TotalRegistrations = source.TotalRegistrations,
            TotalAttendees = source.TotalAttendees,
            AttendanceRate = source.AttendanceRate,
            AverageParticipationScore = source.AvgParticipationScore,
            AverageSessionDuration = source.AvgSessionDuration,
            TotalInteractions = source.TotalInteractions,
            AverageSatisfactionRating = source.AvgSatisfactionRating,
            TotalEngagementBoost = source.TotalEngagementBoost,
            UpdatedAt = GETUTCDATE()
    WHEN NOT MATCHED THEN
        INSERT (EventId, ClubId, TotalRegistrations, TotalAttendees, AttendanceRate, 
                AverageParticipationScore, AverageSessionDuration, TotalInteractions,
                AverageSatisfactionRating, TotalEngagementBoost)
        VALUES (source.EventId, source.ClubId, source.TotalRegistrations, source.TotalAttendees, 
                source.AttendanceRate, source.AvgParticipationScore, source.AvgSessionDuration,
                source.TotalInteractions, source.AvgSatisfactionRating, source.TotalEngagementBoost);
END

-- ========================================
-- 11. Initial Setup and Default Data
-- ========================================

-- Create default scoring rules for existing clubs
INSERT INTO EventEngagementScoringRules (
    ClubId, RuleName, AttendanceWeight, ParticipationWeight, 
    InteractionWeight, SatisfactionWeight, NetworkingWeight, CreatedByUserId
)
SELECT DISTINCT 
    c.Id as ClubId,
    'Default Event Engagement Scoring' as RuleName,
    30.0 as AttendanceWeight,
    25.0 as ParticipationWeight,
    20.0 as InteractionWeight,
    15.0 as SatisfactionWeight,
    10.0 as NetworkingWeight,
    1 as CreatedByUserId -- Assuming admin user ID = 1
FROM Clubs c
WHERE c.Id NOT IN (SELECT DISTINCT ClubId FROM EventEngagementScoringRules);

-- Create member event engagement scores for active members
INSERT INTO MemberEventEngagementScores (MemberId)
SELECT DISTINCT m.Id
FROM Members m
WHERE m.Status = 'Active'
    AND m.Id NOT IN (SELECT MemberId FROM MemberEventEngagementScores);

PRINT 'Event Engagement Analytics System tables created successfully!'
PRINT 'Tables created:'
PRINT '- EventEngagementTracking (comprehensive event participation tracking)'
PRINT '- EventAnalyticsMetrics (event performance metrics)'
PRINT '- EventEngagementScoringRules (configurable scoring system)'
PRINT '- EventRecommendations (AI-driven event recommendations)'
PRINT '- EventEngagementTrends (historical trend analysis)'
PRINT '- MemberEventEngagementScores (member-level event engagement)'
PRINT '- EventFeedbackAnalysis (satisfaction and sentiment tracking)'
PRINT '- Views: vw_EventEngagementOverview, vw_MemberEventEngagementSummary, vw_ClubEventEngagementDashboard'
PRINT '- Stored Procedures: sp_CalculateEventEngagementScore'
PRINT '- Triggers: Automatic updates to member engagement scores and analytics'
PRINT 'Integration with existing MemberEngagementScores table completed'
PRINT 'Default scoring rules and member records initialized'