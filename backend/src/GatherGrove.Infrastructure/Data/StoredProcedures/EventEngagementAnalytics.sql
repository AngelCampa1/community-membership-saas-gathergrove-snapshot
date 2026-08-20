-- =============================================
-- Event Engagement Analytics Stored Procedures
-- =============================================

-- 1. Calculate Member Event Engagement Score
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CalculateMemberEventEngagementScore]
    @MemberId INT,
    @CalculationDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @CalculationDate IS NULL
        SET @CalculationDate = GETUTCDATE();

    -- Update or insert member event engagement scores
    MERGE MemberEventEngagementScores AS target
    USING (
        SELECT 
            @MemberId AS MemberId,
            COUNT(DISTINCT eet.EventId) AS TotalEventsAttended,
            CAST(COALESCE(
                COUNT(DISTINCT CASE WHEN eet.AttendanceStatus = 'attended' THEN eet.EventId END) * 100.0 / 
                NULLIF(COUNT(DISTINCT er.EventId), 0), 0
            ) AS DECIMAL(5,2)) AS EventAttendanceRate,
            CAST(COALESCE(AVG(eet.ParticipationScore), 0) AS DECIMAL(5,2)) AS AverageEventEngagementScore,
            CAST(COALESCE(AVG(eet.NetworkingConnections), 0) AS DECIMAL(5,2)) AS NetworkingScore,
            CAST(CASE 
                WHEN COUNT(DISTINCT eet.EventId) >= 10 AND AVG(eet.ParticipationScore) >= 80 THEN 95.0
                WHEN COUNT(DISTINCT eet.EventId) >= 5 AND AVG(eet.ParticipationScore) >= 60 THEN 75.0
                WHEN COUNT(DISTINCT eet.EventId) >= 3 AND AVG(eet.ParticipationScore) >= 40 THEN 55.0
                ELSE 35.0
            END AS DECIMAL(5,2)) AS EventRetentionProbability,
            CASE 
                WHEN AVG(eet.ParticipationScore) > LAG(AVG(eet.ParticipationScore), 1, 0) OVER (ORDER BY @CalculationDate) THEN 'improving'
                WHEN AVG(eet.ParticipationScore) < LAG(AVG(eet.ParticipationScore), 1, 0) OVER (ORDER BY @CalculationDate) THEN 'declining'
                ELSE 'stable'
            END AS EngagementTrend,
            CASE 
                WHEN AVG(eet.ParticipationScore) < 30 THEN 'high'
                WHEN AVG(eet.ParticipationScore) < 50 THEN 'medium'
                ELSE 'low'
            END AS RiskLevel,
            COUNT(DISTINCT CASE 
                WHEN eet.CreatedAt >= DATEADD(DAY, -90, @CalculationDate) 
                THEN eet.EventId 
            END) AS Recent90DayEvents,
            CAST(COALESCE(AVG(CASE 
                WHEN eet.CreatedAt >= DATEADD(DAY, -90, @CalculationDate) 
                THEN eet.ParticipationScore 
            END), 0) AS DECIMAL(5,2)) AS Recent90DayEngagementScore,
            @CalculationDate AS CalculatedAt,
            @CalculationDate AS UpdatedAt
        FROM EventEngagementTrackings eet
        LEFT JOIN EventRsvps er ON er.EventId = eet.EventId AND er.MemberId = eet.MemberId
        WHERE eet.MemberId = @MemberId
    ) AS source ON target.MemberId = source.MemberId
    WHEN MATCHED THEN
        UPDATE SET
            TotalEventsAttended = source.TotalEventsAttended,
            EventAttendanceRate = source.EventAttendanceRate,
            AverageEventEngagementScore = source.AverageEventEngagementScore,
            NetworkingScore = source.NetworkingScore,
            EventRetentionProbability = source.EventRetentionProbability,
            EngagementTrend = source.EngagementTrend,
            RiskLevel = source.RiskLevel,
            Recent90DayEvents = source.Recent90DayEvents,
            Recent90DayEngagementScore = source.Recent90DayEngagementScore,
            CalculatedAt = source.CalculatedAt,
            UpdatedAt = source.UpdatedAt
    WHEN NOT MATCHED THEN
        INSERT (
            MemberId, TotalEventsAttended, EventAttendanceRate, 
            AverageEventEngagementScore, NetworkingScore, EventRetentionProbability,
            EngagementTrend, RiskLevel, Recent90DayEvents, Recent90DayEngagementScore,
            CalculatedAt, CreatedAt, UpdatedAt
        )
        VALUES (
            source.MemberId, source.TotalEventsAttended, source.EventAttendanceRate,
            source.AverageEventEngagementScore, source.NetworkingScore, source.EventRetentionProbability,
            source.EngagementTrend, source.RiskLevel, source.Recent90DayEvents, source.Recent90DayEngagementScore,
            source.CalculatedAt, @CalculationDate, source.UpdatedAt
        );
END
GO

-- 2. Calculate Event Analytics Metrics
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CalculateEventAnalyticsMetrics]
    @EventId INT,
    @CalculationDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @CalculationDate IS NULL
        SET @CalculationDate = GETUTCDATE();

    -- Update or insert event analytics metrics
    MERGE EventAnalyticsMetrics AS target
    USING (
        SELECT 
            e.Id AS EventId,
            e.ClubId,
            COUNT(DISTINCT er.MemberId) AS TotalRegistrations,
            COUNT(DISTINCT CASE WHEN eet.AttendanceStatus = 'attended' THEN eet.MemberId END) AS TotalAttendees,
            CAST(COALESCE(
                COUNT(DISTINCT CASE WHEN eet.AttendanceStatus = 'attended' THEN eet.MemberId END) * 100.0 /
                NULLIF(COUNT(DISTINCT er.MemberId), 0), 0
            ) AS DECIMAL(5,2)) AS AttendanceRate,
            CAST(COALESCE(
                COUNT(DISTINCT CASE WHEN eet.AttendanceStatus = 'no_show' THEN eet.MemberId END) * 100.0 /
                NULLIF(COUNT(DISTINCT er.MemberId), 0), 0
            ) AS DECIMAL(5,2)) AS NoShowRate,
            CAST(COALESCE(AVG(eet.ParticipationScore), 0) AS DECIMAL(5,2)) AS AverageParticipationScore,
            COALESCE(AVG(eet.SessionDurationMinutes), 0) AS AverageSessionDuration,
            SUM(eet.InteractionCount) AS TotalInteractions,
            COUNT(DISTINCT CASE WHEN eet.InteractionCount > 0 THEN eet.MemberId END) AS UniqueParticipants,
            CAST(COALESCE(AVG(eet.SatisfactionRating), 0) AS DECIMAL(3,1)) AS AverageSatisfactionRating,
            CAST(COALESCE(AVG(CAST(eet.NetPromoterScore AS DECIMAL)), 0) AS DECIMAL(4,1)) AS AverageNPS,
            CAST(COALESCE(
                COUNT(CASE WHEN eet.PostEventSurveyCompleted = 1 THEN 1 END) * 100.0 /
                NULLIF(COUNT(DISTINCT eet.MemberId), 0), 0
            ) AS DECIMAL(5,2)) AS SurveyResponseRate,
            COUNT(CASE WHEN eet.ParticipationLevel = 'highly_active' THEN 1 END) AS HighlyActiveCount,
            COUNT(CASE WHEN eet.ParticipationLevel = 'active' THEN 1 END) AS ActiveCount,
            COUNT(CASE WHEN eet.ParticipationLevel = 'moderate' THEN 1 END) AS ModerateCount,
            COUNT(CASE WHEN eet.ParticipationLevel = 'passive' THEN 1 END) AS PassiveCount,
            COUNT(CASE WHEN eet.ParticipationLevel = 'disengaged' THEN 1 END) AS DisengagedCount,
            CAST(COALESCE(
                COUNT(CASE WHEN eet.Platform IN ('mobile', 'ios', 'android') THEN 1 END) * 100.0 /
                NULLIF(COUNT(*), 0), 0
            ) AS DECIMAL(5,2)) AS MobileUsagePercentage,
            SUM(CASE WHEN eet.TechnicalIssues = 1 THEN 1 ELSE 0 END) AS TechnicalIssuesCount,
            SUM(eet.NetworkingConnections) AS NetworkingConnectionsMade,
            SUM(eet.ResourcesDownloaded) AS ResourceDownloads,
            0 AS FollowUpEngagements, -- Calculate separately
            CAST(SUM(eet.EngagementBoost) AS DECIMAL(8,2)) AS TotalEngagementBoost,
            CAST(COALESCE(AVG(eet.EngagementBoost), 0) AS DECIMAL(6,2)) AS AverageEngagementBoost,
            COUNT(CASE WHEN eet.EngagementBoost > 0 THEN 1 END) AS MembersWithBoost,
            -- Calculate success score based on multiple factors
            CAST((
                (COALESCE(AVG(eet.ParticipationScore), 0) * 0.3) +
                (COALESCE(COUNT(DISTINCT CASE WHEN eet.AttendanceStatus = 'attended' THEN eet.MemberId END) * 100.0 / NULLIF(COUNT(DISTINCT er.MemberId), 0), 0) * 0.25) +
                (COALESCE(AVG(eet.SatisfactionRating), 0) * 10 * 0.2) +
                (COALESCE(AVG(CAST(eet.NetPromoterScore AS DECIMAL)), 0) * 0.15) +
                (LEAST(SUM(eet.InteractionCount) / NULLIF(COUNT(*), 0), 100) * 0.1)
            ) AS DECIMAL(5,2)) AS EventSuccessScore,
            @CalculationDate AS CalculatedAt,
            @CalculationDate AS UpdatedAt
        FROM Events e
        LEFT JOIN EventRsvps er ON er.EventId = e.Id
        LEFT JOIN EventEngagementTrackings eet ON eet.EventId = e.Id
        WHERE e.Id = @EventId
        GROUP BY e.Id, e.ClubId
    ) AS source ON target.EventId = source.EventId
    WHEN MATCHED THEN
        UPDATE SET
            TotalRegistrations = source.TotalRegistrations,
            TotalAttendees = source.TotalAttendees,
            AttendanceRate = source.AttendanceRate,
            NoShowRate = source.NoShowRate,
            AverageParticipationScore = source.AverageParticipationScore,
            AverageSessionDuration = source.AverageSessionDuration,
            TotalInteractions = source.TotalInteractions,
            UniqueParticipants = source.UniqueParticipants,
            AverageSatisfactionRating = source.AverageSatisfactionRating,
            AverageNPS = source.AverageNPS,
            SurveyResponseRate = source.SurveyResponseRate,
            HighlyActiveCount = source.HighlyActiveCount,
            ActiveCount = source.ActiveCount,
            ModerateCount = source.ModerateCount,
            PassiveCount = source.PassiveCount,
            DisengagedCount = source.DisengagedCount,
            MobileUsagePercentage = source.MobileUsagePercentage,
            TechnicalIssuesCount = source.TechnicalIssuesCount,
            NetworkingConnectionsMade = source.NetworkingConnectionsMade,
            ResourceDownloads = source.ResourceDownloads,
            TotalEngagementBoost = source.TotalEngagementBoost,
            AverageEngagementBoost = source.AverageEngagementBoost,
            MembersWithBoost = source.MembersWithBoost,
            EventSuccessScore = source.EventSuccessScore,
            CalculatedAt = source.CalculatedAt,
            UpdatedAt = source.UpdatedAt
    WHEN NOT MATCHED THEN
        INSERT (
            EventId, ClubId, TotalRegistrations, TotalAttendees, AttendanceRate, NoShowRate,
            AverageParticipationScore, AverageSessionDuration, TotalInteractions, UniqueParticipants,
            AverageSatisfactionRating, AverageNPS, SurveyResponseRate, HighlyActiveCount, ActiveCount,
            ModerateCount, PassiveCount, DisengagedCount, MobileUsagePercentage, TechnicalIssuesCount,
            NetworkingConnectionsMade, ResourceDownloads, FollowUpEngagements, TotalEngagementBoost,
            AverageEngagementBoost, MembersWithBoost, EventSuccessScore, CalculatedAt, CreatedAt, UpdatedAt
        )
        VALUES (
            source.EventId, source.ClubId, source.TotalRegistrations, source.TotalAttendees, 
            source.AttendanceRate, source.NoShowRate, source.AverageParticipationScore, 
            source.AverageSessionDuration, source.TotalInteractions, source.UniqueParticipants,
            source.AverageSatisfactionRating, source.AverageNPS, source.SurveyResponseRate,
            source.HighlyActiveCount, source.ActiveCount, source.ModerateCount, source.PassiveCount,
            source.DisengagedCount, source.MobileUsagePercentage, source.TechnicalIssuesCount,
            source.NetworkingConnectionsMade, source.ResourceDownloads, source.FollowUpEngagements,
            source.TotalEngagementBoost, source.AverageEngagementBoost, source.MembersWithBoost,
            source.EventSuccessScore, source.CalculatedAt, @CalculationDate, source.UpdatedAt
        );
END
GO

-- 3. Get No-Show Pattern Analysis
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetNoShowPatternAnalysis]
    @ClubId INT = NULL,
    @MemberId INT = NULL,
    @DaysBack INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2 = DATEADD(DAY, -@DaysBack, GETUTCDATE());

    SELECT 
        m.Id AS MemberId,
        m.FirstName + ' ' + m.LastName AS MemberName,
        COUNT(ect.Id) AS TotalCancellations,
        COUNT(CASE WHEN ect.WasNoShow = 1 THEN 1 END) AS NoShowCount,
        COUNT(CASE WHEN ect.CancellationType = 'last_minute' THEN 1 END) AS LastMinuteCancellations,
        AVG(ect.DaysBeforeEvent) AS AvgDaysBeforeCancellation,
        AVG(ect.MemberReliabilityScore) AS CurrentReliabilityScore,
        MAX(ect.ConsecutiveCancellations) AS MaxConsecutiveCancellations,
        AVG(ect.FutureNoShowProbability) AS PredictedNoShowProbability,
        STRING_AGG(ect.CancellationCategory, ', ') AS CommonCancellationReasons,
        COUNT(DISTINCT ect.EventType) AS EventTypesAffected,
        CASE 
            WHEN AVG(ect.FutureNoShowProbability) > 70 THEN 'High Risk'
            WHEN AVG(ect.FutureNoShowProbability) > 40 THEN 'Medium Risk'
            ELSE 'Low Risk'
        END AS RiskCategory
    FROM Members m
    INNER JOIN EventCancellationTrackings ect ON ect.MemberId = m.Id
    INNER JOIN Events e ON e.Id = ect.EventId
    WHERE 
        ect.CreatedAt >= @StartDate
        AND (@ClubId IS NULL OR e.ClubId = @ClubId)
        AND (@MemberId IS NULL OR m.Id = @MemberId)
    GROUP BY m.Id, m.FirstName, m.LastName
    HAVING COUNT(ect.Id) > 0
    ORDER BY COUNT(ect.Id) DESC, AVG(ect.FutureNoShowProbability) DESC;
END
GO

-- 4. Get Event Satisfaction Correlation Analysis
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetEventSatisfactionCorrelations]
    @ClubId INT,
    @EventType NVARCHAR(50) = NULL,
    @DaysBack INT = 180
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2 = DATEADD(DAY, -@DaysBack, GETUTCDATE());

    SELECT 
        e.Name AS EventName,
        e.EventDateTime,
        COALESCE(e.Location, 'Online') AS EventLocation,
        eam.AttendanceRate,
        eam.AverageSatisfactionRating,
        eam.AverageNPS,
        eam.AverageParticipationScore,
        eam.EventSuccessScore,
        -- Correlation factors
        CASE 
            WHEN e.MaxCapacity IS NOT NULL THEN 
                CAST((eam.TotalAttendees * 100.0 / e.MaxCapacity) AS DECIMAL(5,2))
            ELSE NULL
        END AS CapacityUtilization,
        CASE 
            WHEN DATEPART(HOUR, e.EventDateTime) BETWEEN 9 AND 11 THEN 'Morning'
            WHEN DATEPART(HOUR, e.EventDateTime) BETWEEN 12 AND 17 THEN 'Afternoon'
            WHEN DATEPART(HOUR, e.EventDateTime) BETWEEN 18 AND 21 THEN 'Evening'
            ELSE 'Other'
        END AS TimeOfDay,
        DATENAME(WEEKDAY, e.EventDateTime) AS DayOfWeek,
        eam.MobileUsagePercentage,
        eam.TechnicalIssuesCount,
        eam.NetworkingConnectionsMade,
        -- Satisfaction categories
        CASE 
            WHEN eam.AverageSatisfactionRating >= 4.5 THEN 'Excellent'
            WHEN eam.AverageSatisfactionRating >= 3.5 THEN 'Good'
            WHEN eam.AverageSatisfactionRating >= 2.5 THEN 'Fair'
            ELSE 'Poor'
        END AS SatisfactionCategory,
        -- Engagement correlation
        (eam.AverageSatisfactionRating * eam.AverageParticipationScore / 100.0) AS SatisfactionEngagementProduct
    FROM Events e
    INNER JOIN EventAnalyticsMetrics eam ON eam.EventId = e.Id
    WHERE 
        e.ClubId = @ClubId
        AND e.EventDateTime >= @StartDate
        AND (@EventType IS NULL OR e.Name LIKE '%' + @EventType + '%')
        AND eam.AverageSatisfactionRating IS NOT NULL
    ORDER BY eam.EventSuccessScore DESC, e.EventDateTime DESC;

    -- Summary statistics
    SELECT 
        'Summary Statistics' AS Analysis,
        COUNT(*) AS TotalEventsAnalyzed,
        AVG(eam.AverageSatisfactionRating) AS OverallAvgSatisfaction,
        AVG(eam.AverageNPS) AS OverallAvgNPS,
        AVG(eam.AttendanceRate) AS OverallAttendanceRate,
        AVG(eam.AverageParticipationScore) AS OverallEngagementScore,
        STDEV(eam.AverageSatisfactionRating) AS SatisfactionStdDev,
        -- Correlation insights
        (
            SELECT COUNT(*) FROM Events e2 
            INNER JOIN EventAnalyticsMetrics eam2 ON eam2.EventId = e2.Id
            WHERE e2.ClubId = @ClubId 
            AND e2.EventDateTime >= @StartDate
            AND eam2.AverageSatisfactionRating >= 4.0 
            AND eam2.AttendanceRate >= 80
        ) AS HighSatisfactionHighAttendanceCount
    FROM Events e
    INNER JOIN EventAnalyticsMetrics eam ON eam.EventId = e.Id
    WHERE 
        e.ClubId = @ClubId
        AND e.EventDateTime >= @StartDate
        AND eam.AverageSatisfactionRating IS NOT NULL;
END
GO

-- 5. Batch Update All Member Engagement Scores
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_BatchUpdateMemberEngagementScores]
    @ClubId INT = NULL,
    @BatchSize INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ProcessedCount INT = 0;
    DECLARE @MemberId INT;
    DECLARE @CurrentBatch INT = 0;
    
    DECLARE member_cursor CURSOR FOR
        SELECT DISTINCT m.Id
        FROM Members m
        INNER JOIN EventEngagementTrackings eet ON eet.MemberId = m.Id
        INNER JOIN Events e ON e.Id = eet.EventId
        WHERE (@ClubId IS NULL OR e.ClubId = @ClubId)
        ORDER BY m.Id;
    
    OPEN member_cursor;
    FETCH NEXT FROM member_cursor INTO @MemberId;
    
    WHILE @@FETCH_STATUS = 0 AND @CurrentBatch < @BatchSize
    BEGIN
        EXEC sp_CalculateMemberEventEngagementScore @MemberId = @MemberId;
        
        SET @ProcessedCount = @ProcessedCount + 1;
        SET @CurrentBatch = @CurrentBatch + 1;
        
        FETCH NEXT FROM member_cursor INTO @MemberId;
    END
    
    CLOSE member_cursor;
    DEALLOCATE member_cursor;
    
    SELECT @ProcessedCount AS ProcessedMembers, GETUTCDATE() AS CompletedAt;
END
GO