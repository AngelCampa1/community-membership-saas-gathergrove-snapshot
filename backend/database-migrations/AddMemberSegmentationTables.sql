-- Member Segmentation Database Migration
-- Creates all tables needed for member segmentation functionality
-- Generated: 2025-09-25
-- Version: 1.0.0

-- Member Custom Fields Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberCustomFields' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberCustomFields] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [ClubId] int NOT NULL,
        [FieldName] nvarchar(100) NOT NULL,
        [FieldType] nvarchar(20) NOT NULL,
        [Description] nvarchar(500) NULL,
        [FieldOptions] nvarchar(max) NULL,
        [IsRequired] bit NOT NULL DEFAULT 0,
        [DisplayOrder] int NOT NULL DEFAULT 0,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] int NOT NULL,
        [UpdatedAt] datetime2(7) NULL,
        [UpdatedBy] int NULL,
        CONSTRAINT [PK_MemberCustomFields] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberCustomFields_Clubs_ClubId] FOREIGN KEY([ClubId]) REFERENCES [dbo].[Clubs]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberCustomFields_Users_CreatedBy] FOREIGN KEY([CreatedBy]) REFERENCES [dbo].[Users]([Id]),
        CONSTRAINT [FK_MemberCustomFields_Users_UpdatedBy] FOREIGN KEY([UpdatedBy]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_MemberCustomFields_ClubId] ON [dbo].[MemberCustomFields]([ClubId]);
    CREATE INDEX [IX_MemberCustomFields_CreatedBy] ON [dbo].[MemberCustomFields]([CreatedBy]);
    CREATE INDEX [IX_MemberCustomFields_UpdatedBy] ON [dbo].[MemberCustomFields]([UpdatedBy]);
    CREATE UNIQUE INDEX [IX_MemberCustomFields_ClubId_FieldName] ON [dbo].[MemberCustomFields]([ClubId], [FieldName]) WHERE [IsActive] = 1;
END

-- Member Tags Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberTags' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberTags] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [ClubId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [Color] nvarchar(7) NOT NULL DEFAULT '#007bff',
        [IsVisible] bit NOT NULL DEFAULT 1,
        [DisplayOrder] int NOT NULL DEFAULT 0,
        [CreatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CreatedByUserId] int NOT NULL,
        [UpdatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_MemberTags] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberTags_Clubs_ClubId] FOREIGN KEY([ClubId]) REFERENCES [dbo].[Clubs]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberTags_Users_CreatedByUserId] FOREIGN KEY([CreatedByUserId]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_MemberTags_ClubId] ON [dbo].[MemberTags]([ClubId]);
    CREATE INDEX [IX_MemberTags_CreatedByUserId] ON [dbo].[MemberTags]([CreatedByUserId]);
    CREATE UNIQUE INDEX [IX_MemberTags_ClubId_Name] ON [dbo].[MemberTags]([ClubId], [Name]);
END

-- Member Tag Assignments Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberTagAssignments' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberTagAssignments] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [MemberId] int NOT NULL,
        [TagId] int NOT NULL,
        [AssignedByUserId] int NOT NULL,
        [AssignedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [IsActive] bit NOT NULL DEFAULT 1,
        [UnassignedAt] datetime2(7) NULL,
        [UnassignedByUserId] int NULL,
        CONSTRAINT [PK_MemberTagAssignments] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberTagAssignments_Members_MemberId] FOREIGN KEY([MemberId]) REFERENCES [dbo].[Members]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberTagAssignments_MemberTags_TagId] FOREIGN KEY([TagId]) REFERENCES [dbo].[MemberTags]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberTagAssignments_Users_AssignedByUserId] FOREIGN KEY([AssignedByUserId]) REFERENCES [dbo].[Users]([Id]),
        CONSTRAINT [FK_MemberTagAssignments_Users_UnassignedByUserId] FOREIGN KEY([UnassignedByUserId]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_MemberTagAssignments_MemberId] ON [dbo].[MemberTagAssignments]([MemberId]);
    CREATE INDEX [IX_MemberTagAssignments_TagId] ON [dbo].[MemberTagAssignments]([TagId]);
    CREATE INDEX [IX_MemberTagAssignments_AssignedByUserId] ON [dbo].[MemberTagAssignments]([AssignedByUserId]);
    CREATE INDEX [IX_MemberTagAssignments_IsActive] ON [dbo].[MemberTagAssignments]([IsActive]);
    CREATE UNIQUE INDEX [IX_MemberTagAssignments_MemberId_TagId] ON [dbo].[MemberTagAssignments]([MemberId], [TagId]) WHERE [IsActive] = 1;
END

-- Member Segments Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberSegments' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberSegments] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [ClubId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [FilterCriteria] ntext NOT NULL DEFAULT '{}',
        [IsActive] bit NOT NULL DEFAULT 1,
        [IsSystemGenerated] bit NOT NULL DEFAULT 0,
        [MemberCount] int NOT NULL DEFAULT 0,
        [LastCalculated] datetime2(7) NULL,
        [CalculationDurationMs] int NULL,
        [CreatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CreatedByUserId] int NOT NULL,
        [UpdatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_MemberSegments] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberSegments_Clubs_ClubId] FOREIGN KEY([ClubId]) REFERENCES [dbo].[Clubs]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberSegments_Users_CreatedByUserId] FOREIGN KEY([CreatedByUserId]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_MemberSegments_ClubId] ON [dbo].[MemberSegments]([ClubId]);
    CREATE INDEX [IX_MemberSegments_CreatedByUserId] ON [dbo].[MemberSegments]([CreatedByUserId]);
    CREATE INDEX [IX_MemberSegments_IsActive] ON [dbo].[MemberSegments]([IsActive]);
    CREATE UNIQUE INDEX [IX_MemberSegments_ClubId_Name] ON [dbo].[MemberSegments]([ClubId], [Name]) WHERE [IsActive] = 1;
END

-- Member Segment Cache Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberSegmentCache' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberSegmentCache] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [SegmentId] int NOT NULL,
        [MemberId] int NOT NULL,
        [LastUpdated] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [IsIncluded] bit NOT NULL DEFAULT 1,
        [CalculationVersion] int NOT NULL DEFAULT 1,
        CONSTRAINT [PK_MemberSegmentCache] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberSegmentCache_MemberSegments_SegmentId] FOREIGN KEY([SegmentId]) REFERENCES [dbo].[MemberSegments]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberSegmentCache_Members_MemberId] FOREIGN KEY([MemberId]) REFERENCES [dbo].[Members]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_MemberSegmentCache_SegmentId] ON [dbo].[MemberSegmentCache]([SegmentId]);
    CREATE INDEX [IX_MemberSegmentCache_MemberId] ON [dbo].[MemberSegmentCache]([MemberId]);
    CREATE INDEX [IX_MemberSegmentCache_IsIncluded] ON [dbo].[MemberSegmentCache]([IsIncluded]);
    CREATE UNIQUE INDEX [IX_MemberSegmentCache_SegmentId_MemberId] ON [dbo].[MemberSegmentCache]([SegmentId], [MemberId]);
END

-- Member Segment History Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MemberSegmentHistory' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[MemberSegmentHistory] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [SegmentId] int NOT NULL,
        [MemberCount] int NOT NULL,
        [CalculatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CalculationDurationMs] int NOT NULL,
        [TriggeredBy] nvarchar(50) NOT NULL DEFAULT 'Manual',
        [TriggeredByUserId] int NULL,
        [FilterCriteriaSnapshot] ntext NULL,
        CONSTRAINT [PK_MemberSegmentHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MemberSegmentHistory_MemberSegments_SegmentId] FOREIGN KEY([SegmentId]) REFERENCES [dbo].[MemberSegments]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MemberSegmentHistory_Users_TriggeredByUserId] FOREIGN KEY([TriggeredByUserId]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_MemberSegmentHistory_SegmentId] ON [dbo].[MemberSegmentHistory]([SegmentId]);
    CREATE INDEX [IX_MemberSegmentHistory_CalculatedAt] ON [dbo].[MemberSegmentHistory]([CalculatedAt]);
    CREATE INDEX [IX_MemberSegmentHistory_TriggeredByUserId] ON [dbo].[MemberSegmentHistory]([TriggeredByUserId]);
END

-- Bulk Operations Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BulkOperations' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[BulkOperations] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [ClubId] int NOT NULL,
        [OperationType] nvarchar(50) NOT NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT 'PENDING',
        [InitiatedBy] int NOT NULL,
        [CreatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [StartedAt] datetime2(7) NULL,
        [CompletedAt] datetime2(7) NULL,
        [TotalRecords] int NOT NULL DEFAULT 0,
        [ProcessedRecords] int NOT NULL DEFAULT 0,
        [SuccessfulRecords] int NOT NULL DEFAULT 0,
        [FailedRecords] int NOT NULL DEFAULT 0,
        [ErrorMessage] nvarchar(1000) NULL,
        [Parameters] ntext NULL,
        [ResultData] ntext NULL,
        [RetryCount] int NOT NULL DEFAULT 0,
        [ScheduledFor] datetime2(7) NULL,
        CONSTRAINT [PK_BulkOperations] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_BulkOperations_Clubs_ClubId] FOREIGN KEY([ClubId]) REFERENCES [dbo].[Clubs]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_BulkOperations_Users_InitiatedBy] FOREIGN KEY([InitiatedBy]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_BulkOperations_ClubId] ON [dbo].[BulkOperations]([ClubId]);
    CREATE INDEX [IX_BulkOperations_InitiatedBy] ON [dbo].[BulkOperations]([InitiatedBy]);
    CREATE INDEX [IX_BulkOperations_Status] ON [dbo].[BulkOperations]([Status]);
    CREATE INDEX [IX_BulkOperations_OperationType] ON [dbo].[BulkOperations]([OperationType]);
    CREATE INDEX [IX_BulkOperations_CreatedAt] ON [dbo].[BulkOperations]([CreatedAt]);
END

-- Bulk Operation Items Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BulkOperationItems' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[BulkOperationItems] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [BulkOperationId] int NOT NULL,
        [RecordId] int NOT NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT 'PENDING',
        [ProcessedAt] datetime2(7) NULL,
        [ErrorMessage] nvarchar(500) NULL,
        [RetryCount] int NOT NULL DEFAULT 0,
        CONSTRAINT [PK_BulkOperationItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_BulkOperationItems_BulkOperations_BulkOperationId] FOREIGN KEY([BulkOperationId]) REFERENCES [dbo].[BulkOperations]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_BulkOperationItems_BulkOperationId] ON [dbo].[BulkOperationItems]([BulkOperationId]);
    CREATE INDEX [IX_BulkOperationItems_RecordId] ON [dbo].[BulkOperationItems]([RecordId]);
    CREATE INDEX [IX_BulkOperationItems_Status] ON [dbo].[BulkOperationItems]([Status]);
END

-- Segment Analytics Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SegmentAnalytics' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[SegmentAnalytics] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [SegmentId] int NOT NULL,
        [MemberCount] int NOT NULL DEFAULT 0,
        [EngagementScore] float NOT NULL DEFAULT 0.0,
        [EventAttendanceRate] float NOT NULL DEFAULT 0.0,
        [PaymentComplianceRate] float NOT NULL DEFAULT 0.0,
        [LastCalculated] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CalculationPeriodDays] int NOT NULL DEFAULT 30,
        [TrendDirection] nvarchar(20) NULL,
        [GrowthRate] float NOT NULL DEFAULT 0.0,
        CONSTRAINT [PK_SegmentAnalytics] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_SegmentAnalytics_MemberSegments_SegmentId] FOREIGN KEY([SegmentId]) REFERENCES [dbo].[MemberSegments]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_SegmentAnalytics_SegmentId] ON [dbo].[SegmentAnalytics]([SegmentId]);
    CREATE INDEX [IX_SegmentAnalytics_LastCalculated] ON [dbo].[SegmentAnalytics]([LastCalculated]);
    CREATE UNIQUE INDEX [IX_SegmentAnalytics_SegmentId_Unique] ON [dbo].[SegmentAnalytics]([SegmentId]);
END

-- Segment Performance Metrics Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SegmentPerformanceMetrics' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[SegmentPerformanceMetrics] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [SegmentId] int NOT NULL,
        [MetricName] nvarchar(100) NOT NULL,
        [MetricValue] float NOT NULL DEFAULT 0.0,
        [MetricType] nvarchar(20) NOT NULL DEFAULT 'COUNT',
        [Description] nvarchar(500) NULL,
        [CalculatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedBy] int NULL,
        CONSTRAINT [PK_SegmentPerformanceMetrics] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_SegmentPerformanceMetrics_MemberSegments_SegmentId] FOREIGN KEY([SegmentId]) REFERENCES [dbo].[MemberSegments]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SegmentPerformanceMetrics_Users_CreatedBy] FOREIGN KEY([CreatedBy]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_SegmentPerformanceMetrics_SegmentId] ON [dbo].[SegmentPerformanceMetrics]([SegmentId]);
    CREATE INDEX [IX_SegmentPerformanceMetrics_MetricName] ON [dbo].[SegmentPerformanceMetrics]([MetricName]);
    CREATE INDEX [IX_SegmentPerformanceMetrics_CalculatedAt] ON [dbo].[SegmentPerformanceMetrics]([CalculatedAt]);
    CREATE INDEX [IX_SegmentPerformanceMetrics_CreatedBy] ON [dbo].[SegmentPerformanceMetrics]([CreatedBy]);
END

-- Segment Filter Templates Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SegmentFilterTemplates' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[SegmentFilterTemplates] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [ClubId] int NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [FilterCriteria] ntext NOT NULL,
        [IsPublic] bit NOT NULL DEFAULT 0,
        [IsSystemTemplate] bit NOT NULL DEFAULT 0,
        [UsageCount] int NOT NULL DEFAULT 0,
        [CreatedAt] datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] int NULL,
        [Category] nvarchar(50) NULL,
        CONSTRAINT [PK_SegmentFilterTemplates] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_SegmentFilterTemplates_Clubs_ClubId] FOREIGN KEY([ClubId]) REFERENCES [dbo].[Clubs]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SegmentFilterTemplates_Users_CreatedBy] FOREIGN KEY([CreatedBy]) REFERENCES [dbo].[Users]([Id])
    );

    CREATE INDEX [IX_SegmentFilterTemplates_ClubId] ON [dbo].[SegmentFilterTemplates]([ClubId]);
    CREATE INDEX [IX_SegmentFilterTemplates_CreatedBy] ON [dbo].[SegmentFilterTemplates]([CreatedBy]);
    CREATE INDEX [IX_SegmentFilterTemplates_IsPublic] ON [dbo].[SegmentFilterTemplates]([IsPublic]);
    CREATE INDEX [IX_SegmentFilterTemplates_Category] ON [dbo].[SegmentFilterTemplates]([Category]);
END

PRINT 'Member Segmentation tables created successfully!';