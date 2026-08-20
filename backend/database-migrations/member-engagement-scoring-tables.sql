-- Member Engagement Scoring System Database Migration
-- Creates all necessary tables for comprehensive member engagement tracking

-- ========================================
-- 1. Member Engagement Scores (Main Table)
-- ========================================
CREATE TABLE MemberEngagementScores (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Core Engagement Scores (0-100 each)
    LoginFrequencyScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (LoginFrequencyScore >= 0 AND LoginFrequencyScore <= 100),
    EventParticipationScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (EventParticipationScore >= 0 AND EventParticipationScore <= 100),
    CommunicationScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (CommunicationScore >= 0 AND CommunicationScore <= 100),
    FeatureUsageScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (FeatureUsageScore >= 0 AND FeatureUsageScore <= 100),
    ProfileCompletenessScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (ProfileCompletenessScore >= 0 AND ProfileCompletenessScore <= 100),
    
    -- Calculated Overall Score
    OverallScore DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (OverallScore >= 0 AND OverallScore <= 100),
    
    -- Classification System (1=Green, 2=Yellow, 3=Red)
    Level INT NOT NULL DEFAULT 3 CHECK (Level IN (1, 2, 3)),
    VisualIndicator NVARCHAR(10) NOT NULL DEFAULT 'red' CHECK (VisualIndicator IN ('green', 'yellow', 'red')),
    
    -- Metrics Tracking (30-day window)
    LoginCount INT NOT NULL DEFAULT 0,
    EventsAttendedCount INT NOT NULL DEFAULT 0,
    CommunicationsCount INT NOT NULL DEFAULT 0,
    UniqueFeaturesUsed INT NOT NULL DEFAULT 0,
    ProfileCompletionPercent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (ProfileCompletionPercent >= 0 AND ProfileCompletionPercent <= 100),
    
    -- Temporal Data
    LastActivity DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PreviousCalculatedAt DATETIME2 NULL,
    PreviousOverallScore DECIMAL(5,2) NULL CHECK (PreviousOverallScore IS NULL OR (PreviousOverallScore >= 0 AND PreviousOverallScore <= 100)),
    
    -- Alert Tracking
    IsAtRisk BIT NOT NULL DEFAULT 0,
    LastAlertSent DATETIME2 NULL,
    ConsecutiveDeclines INT NOT NULL DEFAULT 0,
    
    -- Audit Fields
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberEngagementScores_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_MemberEngagementScores_Member UNIQUE (MemberId)
);

-- Indexes for performance
CREATE INDEX IX_MemberEngagementScores_OverallScore ON MemberEngagementScores(OverallScore);
CREATE INDEX IX_MemberEngagementScores_Level ON MemberEngagementScores(Level);
CREATE INDEX IX_MemberEngagementScores_LastActivity ON MemberEngagementScores(LastActivity);
CREATE INDEX IX_MemberEngagementScores_IsAtRisk ON MemberEngagementScores(IsAtRisk);
CREATE INDEX IX_MemberEngagementScores_CalculatedAt ON MemberEngagementScores(CalculatedAt);

-- ========================================
-- 2. Member Engagement History
-- ========================================
CREATE TABLE MemberEngagementHistory (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Score Snapshot
    OverallScore DECIMAL(5,2) NOT NULL CHECK (OverallScore >= 0 AND OverallScore <= 100),
    LoginFrequencyScore DECIMAL(5,2) NOT NULL CHECK (LoginFrequencyScore >= 0 AND LoginFrequencyScore <= 100),
    EventParticipationScore DECIMAL(5,2) NOT NULL CHECK (EventParticipationScore >= 0 AND EventParticipationScore <= 100),
    CommunicationScore DECIMAL(5,2) NOT NULL CHECK (CommunicationScore >= 0 AND CommunicationScore <= 100),
    FeatureUsageScore DECIMAL(5,2) NOT NULL CHECK (FeatureUsageScore >= 0 AND FeatureUsageScore <= 100),
    ProfileCompletenessScore DECIMAL(5,2) NOT NULL CHECK (ProfileCompletenessScore >= 0 AND ProfileCompletenessScore <= 100),
    
    -- Level at time of recording
    Level INT NOT NULL CHECK (Level IN (1, 2, 3)),
    
    -- Timestamp
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Metrics snapshot (JSON)
    MetricsSnapshot NTEXT NOT NULL DEFAULT '{}',
    
    -- Foreign Key
    CONSTRAINT FK_MemberEngagementHistory_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE
);

-- Indexes for history queries
CREATE INDEX IX_MemberEngagementHistory_Member_RecordedAt ON MemberEngagementHistory(MemberId, RecordedAt);
CREATE INDEX IX_MemberEngagementHistory_RecordedAt ON MemberEngagementHistory(RecordedAt);
CREATE INDEX IX_MemberEngagementHistory_Level ON MemberEngagementHistory(Level);

-- ========================================
-- 3. Member Engagement Alerts
-- ========================================
CREATE TABLE MemberEngagementAlerts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Alert Classification
    Type INT NOT NULL CHECK (Type IN (1, 2, 3, 4, 5, 6)), -- AlertType enum values
    Severity INT NOT NULL CHECK (Severity IN (1, 2, 3, 4)), -- AlertSeverity enum values
    
    -- Score Information
    TriggerScore DECIMAL(5,2) NOT NULL CHECK (TriggerScore >= 0 AND TriggerScore <= 100),
    PreviousScore DECIMAL(5,2) NULL CHECK (PreviousScore IS NULL OR (PreviousScore >= 0 AND PreviousScore <= 100)),
    ScoreChange DECIMAL(6,2) NOT NULL, -- Can be negative
    
    -- Alert Content
    Message NVARCHAR(500) NOT NULL,
    RecommendedActions NVARCHAR(1000) NULL,
    
    -- Resolution Tracking
    IsResolved BIT NOT NULL DEFAULT 0,
    ResolvedAt DATETIME2 NULL,
    ResolvedByUserId INT NULL,
    ResolutionNotes NVARCHAR(1000) NULL,
    
    -- Notification Tracking
    NotificationsSent BIT NOT NULL DEFAULT 0,
    LastNotificationSent DATETIME2 NULL,
    
    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_MemberEngagementAlerts_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberEngagementAlerts_ResolvedByUser FOREIGN KEY (ResolvedByUserId) 
        REFERENCES Users(Id) ON DELETE SET NULL
);

-- Indexes for alert management
CREATE INDEX IX_MemberEngagementAlerts_Member_IsResolved ON MemberEngagementAlerts(MemberId, IsResolved);
CREATE INDEX IX_MemberEngagementAlerts_Severity_IsResolved ON MemberEngagementAlerts(Severity, IsResolved);
CREATE INDEX IX_MemberEngagementAlerts_Type ON MemberEngagementAlerts(Type);
CREATE INDEX IX_MemberEngagementAlerts_CreatedAt ON MemberEngagementAlerts(CreatedAt);
CREATE INDEX IX_MemberEngagementAlerts_NotificationsSent ON MemberEngagementAlerts(NotificationsSent);

-- ========================================
-- 4. Member Login Tracking
-- ========================================
CREATE TABLE MemberLoginTracking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Login Details
    LoginTimestamp DATETIME2 NOT NULL,
    SessionId NVARCHAR(128) NOT NULL,
    SessionDuration TIME NULL, -- Can use TIME for duration storage
    
    -- Platform Information
    Platform NVARCHAR(20) NOT NULL DEFAULT 'web' CHECK (Platform IN ('web', 'mobile', 'api')),
    DeviceType NVARCHAR(20) NULL,
    
    -- Analytics Data (anonymized)
    IpAddress NVARCHAR(45) NULL, -- Support IPv6
    UserAgent NVARCHAR(500) NULL,
    LocationCode NVARCHAR(10) NULL,
    
    -- Success Tracking
    IsSuccessful BIT NOT NULL DEFAULT 1,
    
    -- Timestamp
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_MemberLoginTracking_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE
);

-- Indexes for login analysis
CREATE INDEX IX_MemberLoginTracking_Member_LoginTimestamp ON MemberLoginTracking(MemberId, LoginTimestamp);
CREATE INDEX IX_MemberLoginTracking_LoginTimestamp ON MemberLoginTracking(LoginTimestamp);
CREATE INDEX IX_MemberLoginTracking_Platform ON MemberLoginTracking(Platform);
CREATE INDEX IX_MemberLoginTracking_IsSuccessful ON MemberLoginTracking(IsSuccessful);

-- ========================================
-- 5. Profile Completeness Tracking
-- ========================================
CREATE TABLE ProfileCompletenessTracking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    
    -- Completion Metrics
    CompletionPercentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (CompletionPercentage >= 0 AND CompletionPercentage <= 100),
    RequiredFieldsTotal INT NOT NULL DEFAULT 0,
    RequiredFieldsCompleted INT NOT NULL DEFAULT 0,
    OptionalFieldsTotal INT NOT NULL DEFAULT 0,
    OptionalFieldsCompleted INT NOT NULL DEFAULT 0,
    
    -- Field Details (JSON arrays)
    IncompleteFields NTEXT NOT NULL DEFAULT '[]',
    RecentlyCompletedFields NTEXT NOT NULL DEFAULT '[]',
    
    -- Timestamps
    CalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key
    CONSTRAINT FK_ProfileCompletenessTracking_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT CK_ProfileCompletenessTracking_RequiredFields 
        CHECK (RequiredFieldsCompleted <= RequiredFieldsTotal),
    CONSTRAINT CK_ProfileCompletenessTracking_OptionalFields 
        CHECK (OptionalFieldsCompleted <= OptionalFieldsTotal)
);

-- Indexes for profile analysis
CREATE INDEX IX_ProfileCompletenessTracking_Member ON ProfileCompletenessTracking(MemberId);
CREATE INDEX IX_ProfileCompletenessTracking_CompletionPercentage ON ProfileCompletenessTracking(CompletionPercentage);
CREATE INDEX IX_ProfileCompletenessTracking_CalculatedAt ON ProfileCompletenessTracking(CalculatedAt);

-- ========================================
-- 6. Update Existing FeatureUsageEvents Table
-- ========================================
-- Add engagement-specific columns to existing FeatureUsageEvents if needed
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'FeatureUsageEvents' AND COLUMN_NAME = 'EngagementWeight')
BEGIN
    ALTER TABLE FeatureUsageEvents ADD EngagementWeight DECIMAL(3,2) NOT NULL DEFAULT 1.0;
    ALTER TABLE FeatureUsageEvents ADD IsHighValueAction BIT NOT NULL DEFAULT 0;
    ALTER TABLE FeatureUsageEvents ADD MemberEngagementScoreId INT NULL;
    
    -- Add foreign key to engagement scores
    ALTER TABLE FeatureUsageEvents 
    ADD CONSTRAINT FK_FeatureUsageEvents_MemberEngagementScore 
    FOREIGN KEY (MemberEngagementScoreId) REFERENCES MemberEngagementScores(Id);
    
    -- Add index for engagement queries
    CREATE INDEX IX_FeatureUsageEvents_Member_EventTimestamp 
    ON FeatureUsageEvents(MemberId, EventTimestamp);
END

-- ========================================
-- 7. Bulk Action Log Table
-- ========================================
CREATE TABLE BulkActionLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClubId INT NOT NULL,
    
    -- Action Details
    ActionType NVARCHAR(50) NOT NULL,
    TargetLevel INT NOT NULL CHECK (TargetLevel IN (1, 2, 3)),
    
    -- Execution Results
    TotalTargeted INT NOT NULL,
    SuccessfulActions INT NOT NULL,
    FailedActions INT NOT NULL,
    
    -- Error Details (JSON)
    Errors NTEXT NULL,
    
    -- Execution Details
    ExecutedByUserId INT NOT NULL,
    ExecutedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Options Used (JSON)
    ActionOptions NTEXT NULL,
    
    -- Foreign Keys
    CONSTRAINT FK_BulkActionLogs_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_BulkActionLogs_ExecutedByUser FOREIGN KEY (ExecutedByUserId) 
        REFERENCES Users(Id) ON DELETE NO ACTION
);

-- Index for bulk action history
CREATE INDEX IX_BulkActionLogs_Club_ExecutedAt ON BulkActionLogs(ClubId, ExecutedAt);
CREATE INDEX IX_BulkActionLogs_ActionType ON BulkActionLogs(ActionType);

-- ========================================
-- 8. Data Migration and Initial Setup
-- ========================================

-- Create initial engagement scores for existing members
INSERT INTO MemberEngagementScores (MemberId, LastActivity, CreatedAt, UpdatedAt)
SELECT 
    Id as MemberId,
    COALESCE(UpdatedAt, CreatedAt) as LastActivity,
    GETUTCDATE() as CreatedAt,
    GETUTCDATE() as UpdatedAt
FROM Members 
WHERE Status = 'Active'
AND Id NOT IN (SELECT MemberId FROM MemberEngagementScores);

-- Create profile completeness tracking for existing members
INSERT INTO ProfileCompletenessTracking (MemberId, CreatedAt, UpdatedAt)
SELECT 
    Id as MemberId,
    GETUTCDATE() as CreatedAt,
    GETUTCDATE() as UpdatedAt
FROM Members 
WHERE Status = 'Active'
AND Id NOT IN (SELECT MemberId FROM ProfileCompletenessTracking);

-- ========================================
-- 9. Triggers for Automatic Updates
-- ========================================

-- Trigger to update CalculatedAt timestamp on score changes
CREATE TRIGGER TR_MemberEngagementScores_UpdateTimestamp
ON MemberEngagementScores
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE MemberEngagementScores
    SET UpdatedAt = GETUTCDATE()
    WHERE Id IN (SELECT DISTINCT Id FROM inserted);
END

-- Trigger to create history record on score changes
CREATE TRIGGER TR_MemberEngagementScores_CreateHistory
ON MemberEngagementScores
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only create history if OverallScore changed significantly
    INSERT INTO MemberEngagementHistory (
        MemberId, OverallScore, LoginFrequencyScore, EventParticipationScore,
        CommunicationScore, FeatureUsageScore, ProfileCompletenessScore,
        Level, RecordedAt, MetricsSnapshot
    )
    SELECT 
        i.MemberId,
        i.OverallScore,
        i.LoginFrequencyScore,
        i.EventParticipationScore,
        i.CommunicationScore,
        i.FeatureUsageScore,
        i.ProfileCompletenessScore,
        i.Level,
        GETUTCDATE(),
        JSON_OBJECT(
            'loginCount', i.LoginCount,
            'eventsAttended', i.EventsAttendedCount,
            'communications', i.CommunicationsCount,
            'featuresUsed', i.UniqueFeaturesUsed,
            'profileCompletion', i.ProfileCompletionPercent
        )
    FROM inserted i
    INNER JOIN deleted d ON i.Id = d.Id
    WHERE ABS(i.OverallScore - d.OverallScore) >= 5.0; -- Only log significant changes
END

-- ========================================
-- 10. Views for Common Queries
-- ========================================

-- View for engagement overview by club
CREATE VIEW vw_EngagementOverviewByClub AS
SELECT 
    m.ClubId,
    COUNT(*) as TotalMembers,
    AVG(mes.OverallScore) as AverageScore,
    SUM(CASE WHEN mes.Level = 1 THEN 1 ELSE 0 END) as HighlyEngaged,
    SUM(CASE WHEN mes.Level = 2 THEN 1 ELSE 0 END) as ModeratelyEngaged,
    SUM(CASE WHEN mes.Level = 3 THEN 1 ELSE 0 END) as AtRisk,
    SUM(CASE WHEN mes.IsAtRisk = 1 THEN 1 ELSE 0 END) as AtRiskMembers,
    COUNT(CASE WHEN mea.IsResolved = 0 THEN 1 END) as ActiveAlerts,
    COUNT(CASE WHEN mea.Severity = 4 AND mea.IsResolved = 0 THEN 1 END) as CriticalAlerts
FROM Members m
LEFT JOIN MemberEngagementScores mes ON m.Id = mes.MemberId
LEFT JOIN MemberEngagementAlerts mea ON m.Id = mea.MemberId
WHERE m.Status = 'Active'
GROUP BY m.ClubId;

-- View for member engagement details
CREATE VIEW vw_MemberEngagementDetails AS
SELECT 
    m.Id as MemberId,
    m.ClubId,
    m.FullName,
    m.Email,
    mes.OverallScore,
    mes.Level,
    mes.VisualIndicator,
    mes.LoginFrequencyScore,
    mes.EventParticipationScore,
    mes.CommunicationScore,
    mes.FeatureUsageScore,
    mes.ProfileCompletenessScore,
    mes.LastActivity,
    mes.CalculatedAt,
    mes.IsAtRisk,
    mes.ConsecutiveDeclines,
    DATEDIFF(day, mes.LastActivity, GETUTCDATE()) as DaysSinceLastActivity,
    COUNT(mea.Id) as ActiveAlerts
FROM Members m
LEFT JOIN MemberEngagementScores mes ON m.Id = mes.MemberId
LEFT JOIN MemberEngagementAlerts mea ON m.Id = mea.MemberId AND mea.IsResolved = 0
WHERE m.Status = 'Active'
GROUP BY m.Id, m.ClubId, m.FullName, m.Email,
         mes.OverallScore, mes.Level, mes.VisualIndicator,
         mes.LoginFrequencyScore, mes.EventParticipationScore,
         mes.CommunicationScore, mes.FeatureUsageScore, 
         mes.ProfileCompletenessScore, mes.LastActivity,
         mes.CalculatedAt, mes.IsAtRisk, mes.ConsecutiveDeclines;

-- ========================================
-- 11. Sample Data and Initial Calculations
-- ========================================

-- Create sample alerts for testing (remove in production)
/*
INSERT INTO MemberEngagementAlerts (MemberId, Type, Severity, TriggerScore, Message, CreatedAt)
SELECT TOP 5
    Id as MemberId,
    3 as Type, -- AtRisk
    3 as Severity, -- High
    25.0 as TriggerScore,
    'Member engagement score is critically low and requires immediate attention' as Message,
    GETUTCDATE() as CreatedAt
FROM Members 
WHERE Status = 'Active'
ORDER BY NEWID();
*/

PRINT 'Member Engagement Scoring System tables created successfully!'
PRINT 'Tables created:'
PRINT '- MemberEngagementScores (with indexes and constraints)'
PRINT '- MemberEngagementHistory (with indexes)'
PRINT '- MemberEngagementAlerts (with indexes)' 
PRINT '- MemberLoginTracking (with indexes)'
PRINT '- ProfileCompletenessTracking (with indexes)'
PRINT '- BulkActionLogs (with indexes)'
PRINT '- Views: vw_EngagementOverviewByClub, vw_MemberEngagementDetails'
PRINT '- Triggers: Score update and history creation'
PRINT 'Initial data migration completed for existing active members'