-- Member Segmentation System Database Migration
-- Creates all necessary tables for member tagging and segmentation functionality

-- ========================================
-- 1. Member Tags System
-- ========================================

-- Club-specific tags for categorizing members
CREATE TABLE MemberTags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClubId INT NOT NULL,
    
    -- Tag Properties
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Color NVARCHAR(7) NOT NULL DEFAULT '#007bff', -- Hex color code
    
    -- Display Properties
    IsVisible BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0,
    
    -- Metadata
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberTags_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberTags_CreatedByUser FOREIGN KEY (CreatedByUserId) 
        REFERENCES Users(Id) ON DELETE NO ACTION,
    
    -- Unique constraint for tag names per club
    CONSTRAINT UQ_MemberTags_Club_Name UNIQUE (ClubId, Name)
);

-- Indexes for performance
CREATE INDEX IX_MemberTags_ClubId ON MemberTags(ClubId);
CREATE INDEX IX_MemberTags_Name ON MemberTags(Name);
CREATE INDEX IX_MemberTags_DisplayOrder ON MemberTags(DisplayOrder);

-- ========================================
-- 2. Member Tag Associations
-- ========================================

-- Many-to-many relationship between members and tags
CREATE TABLE MemberTagAssignments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    TagId INT NOT NULL,
    
    -- Assignment metadata
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    AssignedByUserId INT NOT NULL,
    
    -- Optional context for the assignment
    Notes NVARCHAR(500) NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberTagAssignments_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberTagAssignments_Tags FOREIGN KEY (TagId) 
        REFERENCES MemberTags(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberTagAssignments_AssignedByUser FOREIGN KEY (AssignedByUserId) 
        REFERENCES Users(Id) ON DELETE NO ACTION,
    
    -- Unique constraint to prevent duplicate tag assignments
    CONSTRAINT UQ_MemberTagAssignments_Member_Tag UNIQUE (MemberId, TagId)
);

-- Indexes for performance
CREATE INDEX IX_MemberTagAssignments_MemberId ON MemberTagAssignments(MemberId);
CREATE INDEX IX_MemberTagAssignments_TagId ON MemberTagAssignments(TagId);
CREATE INDEX IX_MemberTagAssignments_AssignedAt ON MemberTagAssignments(AssignedAt);

-- ========================================
-- 3. Member Segments System
-- ========================================

-- Dynamic member segments based on criteria
CREATE TABLE MemberSegments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClubId INT NOT NULL,
    
    -- Segment Properties
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    
    -- Filter Criteria (JSON format for flexibility)
    FilterCriteria NTEXT NOT NULL DEFAULT '{}',
    
    -- Segment Configuration
    IsActive BIT NOT NULL DEFAULT 1,
    IsSystemGenerated BIT NOT NULL DEFAULT 0, -- For system-generated segments like "High Engagement"
    
    -- Caching and Performance
    MemberCount INT NOT NULL DEFAULT 0,
    LastCalculated DATETIME2 NULL,
    CalculationDurationMs INT NULL,
    
    -- Metadata
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberSegments_Clubs FOREIGN KEY (ClubId) 
        REFERENCES Clubs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberSegments_CreatedByUser FOREIGN KEY (CreatedByUserId) 
        REFERENCES Users(Id) ON DELETE NO ACTION,
    
    -- Unique constraint for segment names per club
    CONSTRAINT UQ_MemberSegments_Club_Name UNIQUE (ClubId, Name)
);

-- Indexes for performance
CREATE INDEX IX_MemberSegments_ClubId ON MemberSegments(ClubId);
CREATE INDEX IX_MemberSegments_Name ON MemberSegments(Name);
CREATE INDEX IX_MemberSegments_IsActive ON MemberSegments(IsActive);
CREATE INDEX IX_MemberSegments_LastCalculated ON MemberSegments(LastCalculated);

-- ========================================
-- 4. Member Segment Cache
-- ========================================

-- Cached segment membership for performance
CREATE TABLE MemberSegmentCache (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    SegmentId INT NOT NULL,
    
    -- Cache metadata
    CachedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsValid BIT NOT NULL DEFAULT 1,
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberSegmentCache_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberSegmentCache_Segments FOREIGN KEY (SegmentId) 
        REFERENCES MemberSegments(Id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate cache entries
    CONSTRAINT UQ_MemberSegmentCache_Member_Segment UNIQUE (MemberId, SegmentId)
);

-- Indexes for performance
CREATE INDEX IX_MemberSegmentCache_MemberId ON MemberSegmentCache(MemberId);
CREATE INDEX IX_MemberSegmentCache_SegmentId ON MemberSegmentCache(SegmentId);
CREATE INDEX IX_MemberSegmentCache_IsValid ON MemberSegmentCache(IsValid);

-- ========================================
-- 5. Bulk Operations Log Enhancement
-- ========================================

-- Extend existing bulk operations to support tags and segments
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'BulkActionLogs' AND COLUMN_NAME = 'TargetType')
BEGIN
    ALTER TABLE BulkActionLogs ADD TargetType NVARCHAR(50) NOT NULL DEFAULT 'Member';
    ALTER TABLE BulkActionLogs ADD TargetEntityIds NTEXT NULL; -- JSON array of target IDs
    ALTER TABLE BulkActionLogs ADD FilterCriteria NTEXT NULL; -- JSON of filter criteria used
    
    -- Add index for new columns
    CREATE INDEX IX_BulkActionLogs_TargetType ON BulkActionLogs(TargetType);
END

-- ========================================
-- 6. Member Segmentation History
-- ========================================

-- Track changes to member segment assignments
CREATE TABLE MemberSegmentHistory (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    SegmentId INT NOT NULL,
    
    -- Change tracking
    Action NVARCHAR(20) NOT NULL CHECK (Action IN ('Added', 'Removed', 'Recalculated')),
    Reason NVARCHAR(200) NULL, -- Why the change occurred
    
    -- Metadata
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ChangedByUserId INT NULL, -- NULL for system-generated changes
    
    -- Foreign Key Constraints
    CONSTRAINT FK_MemberSegmentHistory_Members FOREIGN KEY (MemberId) 
        REFERENCES Members(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberSegmentHistory_Segments FOREIGN KEY (SegmentId) 
        REFERENCES MemberSegments(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MemberSegmentHistory_ChangedByUser FOREIGN KEY (ChangedByUserId) 
        REFERENCES Users(Id) ON DELETE SET NULL
);

-- Indexes for history queries
CREATE INDEX IX_MemberSegmentHistory_Member_ChangedAt ON MemberSegmentHistory(MemberId, ChangedAt);
CREATE INDEX IX_MemberSegmentHistory_Segment_ChangedAt ON MemberSegmentHistory(SegmentId, ChangedAt);
CREATE INDEX IX_MemberSegmentHistory_Action ON MemberSegmentHistory(Action);

-- ========================================
-- 7. Advanced Filtering Support Tables
-- ========================================

-- Predefined filter templates for common segmentation scenarios
CREATE TABLE SegmentFilterTemplates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Template Properties
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Category NVARCHAR(50) NOT NULL DEFAULT 'General', -- General, Engagement, Financial, etc.
    
    -- Filter Definition
    FilterCriteria NTEXT NOT NULL,
    
    -- Template Configuration
    IsSystemTemplate BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    UsageCount INT NOT NULL DEFAULT 0,
    
    -- Metadata
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Unique constraint
    CONSTRAINT UQ_SegmentFilterTemplates_Name UNIQUE (Name)
);

-- Indexes for templates
CREATE INDEX IX_SegmentFilterTemplates_Category ON SegmentFilterTemplates(Category);
CREATE INDEX IX_SegmentFilterTemplates_IsActive ON SegmentFilterTemplates(IsActive);
CREATE INDEX IX_SegmentFilterTemplates_UsageCount ON SegmentFilterTemplates(UsageCount);

-- ========================================
-- 8. Performance Views
-- ========================================

-- View for member tag summary
CREATE VIEW vw_MemberTagSummary AS
SELECT 
    m.Id as MemberId,
    m.ClubId,
    m.FullName,
    m.Email,
    COUNT(mta.TagId) as TagCount,
    STRING_AGG(mt.Name, ', ') as TagNames,
    STRING_AGG(mt.Color, ',') as TagColors
FROM Members m
LEFT JOIN MemberTagAssignments mta ON m.Id = mta.MemberId
LEFT JOIN MemberTags mt ON mta.TagId = mt.Id AND mt.IsVisible = 1
WHERE m.Status = 'Active'
GROUP BY m.Id, m.ClubId, m.FullName, m.Email;

-- View for segment membership overview
CREATE VIEW vw_MemberSegmentOverview AS
SELECT 
    ms.ClubId,
    ms.Id as SegmentId,
    ms.Name as SegmentName,
    ms.Description,
    ms.MemberCount,
    ms.LastCalculated,
    ms.IsActive,
    ms.IsSystemGenerated,
    COUNT(msc.MemberId) as CachedMemberCount,
    AVG(CASE WHEN msc.IsValid = 1 THEN 1.0 ELSE 0.0 END) as CacheValidityRatio
FROM MemberSegments ms
LEFT JOIN MemberSegmentCache msc ON ms.Id = msc.SegmentId
GROUP BY ms.ClubId, ms.Id, ms.Name, ms.Description, ms.MemberCount, 
         ms.LastCalculated, ms.IsActive, ms.IsSystemGenerated;

-- View for comprehensive member analytics
CREATE VIEW vw_MemberAnalytics AS
SELECT 
    m.Id as MemberId,
    m.ClubId,
    m.FullName,
    m.Email,
    m.Status,
    m.JoinDate,
    m.LastActive,
    
    -- Engagement data
    mes.OverallScore as EngagementScore,
    mes.Level as EngagementLevel,
    
    -- Tag data
    COALESCE(tag_data.TagCount, 0) as TagCount,
    tag_data.TagNames,
    
    -- Segment data
    COALESCE(segment_data.SegmentCount, 0) as SegmentCount,
    segment_data.SegmentNames,
    
    -- Custom field completion
    COALESCE(cf_data.CustomFieldCount, 0) as CustomFieldCount,
    COALESCE(cf_data.CustomFieldsCompleted, 0) as CustomFieldsCompleted,
    
    -- Calculated fields
    DATEDIFF(day, m.JoinDate, GETUTCDATE()) as DaysSinceJoined,
    CASE WHEN m.LastActive IS NOT NULL 
         THEN DATEDIFF(day, m.LastActive, GETUTCDATE())
         ELSE NULL END as DaysSinceLastActive
         
FROM Members m
LEFT JOIN MemberEngagementScores mes ON m.Id = mes.MemberId
LEFT JOIN (
    SELECT 
        mta.MemberId,
        COUNT(mta.TagId) as TagCount,
        STRING_AGG(mt.Name, ', ') as TagNames
    FROM MemberTagAssignments mta
    INNER JOIN MemberTags mt ON mta.TagId = mt.Id AND mt.IsVisible = 1
    GROUP BY mta.MemberId
) tag_data ON m.Id = tag_data.MemberId
LEFT JOIN (
    SELECT 
        msc.MemberId,
        COUNT(msc.SegmentId) as SegmentCount,
        STRING_AGG(ms.Name, ', ') as SegmentNames
    FROM MemberSegmentCache msc
    INNER JOIN MemberSegments ms ON msc.SegmentId = ms.Id AND ms.IsActive = 1
    WHERE msc.IsValid = 1
    GROUP BY msc.MemberId
) segment_data ON m.Id = segment_data.MemberId
LEFT JOIN (
    SELECT 
        mcfv.MemberId,
        COUNT(ccf.CustomFieldId) as CustomFieldCount,
        COUNT(CASE WHEN mcfv.FieldValue IS NOT NULL AND mcfv.FieldValue != '' THEN 1 END) as CustomFieldsCompleted
    FROM MemberCustomFieldValue mcfv
    INNER JOIN ClubCustomFields ccf ON mcfv.CustomFieldId = ccf.CustomFieldId
    GROUP BY mcfv.MemberId
) cf_data ON m.Id = cf_data.MemberId
WHERE m.Status = 'Active';

-- ========================================
-- 9. Triggers for Data Integrity
-- ========================================

-- Trigger to update segment cache validity when member data changes
CREATE TRIGGER TR_Members_InvalidateSegmentCache
ON Members
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Invalidate segment cache for updated members
    UPDATE MemberSegmentCache
    SET IsValid = 0
    WHERE MemberId IN (SELECT Id FROM inserted);
END

-- Trigger to update member tag assignment timestamp
CREATE TRIGGER TR_MemberTagAssignments_UpdateTimestamp
ON MemberTagAssignments
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update assignment timestamp for new or modified assignments
    UPDATE MemberTagAssignments
    SET AssignedAt = GETUTCDATE()
    WHERE Id IN (SELECT Id FROM inserted);
END

-- ========================================
-- 10. Sample Data and System Setup
-- ========================================

-- Insert common segment filter templates
INSERT INTO SegmentFilterTemplates (Name, Description, Category, FilterCriteria, IsSystemTemplate, IsActive)
VALUES 
    ('High Engagement Members', 'Members with engagement score above 80', 'Engagement', 
     '{"engagementScore": {"operator": ">=", "value": 80}}', 1, 1),
    ('At Risk Members', 'Members with low engagement scores requiring attention', 'Engagement', 
     '{"engagementLevel": {"operator": "=", "value": 3}}', 1, 1),
    ('New Members', 'Members who joined within the last 30 days', 'General', 
     '{"joinDate": {"operator": ">=", "value": "30_days_ago"}}', 1, 1),
    ('Inactive Members', 'Members who haven''t been active in the last 60 days', 'Engagement', 
     '{"lastActive": {"operator": "<=", "value": "60_days_ago"}}', 1, 1),
    ('Premium Members', 'Members with premium membership types', 'Financial', 
     '{"membershipType": {"operator": "in", "values": ["Premium", "VIP"]}}', 1, 1);

PRINT 'Member Segmentation System migration completed successfully!'
PRINT 'Tables created:'
PRINT '- MemberTags (with indexes and constraints)'
PRINT '- MemberTagAssignments (many-to-many with members)'
PRINT '- MemberSegments (dynamic segmentation with JSON criteria)'
PRINT '- MemberSegmentCache (performance optimization)'
PRINT '- MemberSegmentHistory (change tracking)'
PRINT '- SegmentFilterTemplates (predefined filters)'
PRINT 'Views created:'
PRINT '- vw_MemberTagSummary'
PRINT '- vw_MemberSegmentOverview' 
PRINT '- vw_MemberAnalytics'
PRINT 'Triggers created for data integrity and performance'
PRINT 'Sample filter templates inserted for common use cases'