# Event Engagement Analytics Database Schema

> **What actually shipped.** This document was written as a design spec for one subsystem, and
> three of its seven tables were never wired up. Checked against
> `backend/src/GatherGrove.Infrastructure/Data/GatherGroveDbContext.cs`:
>
> | Table | State |
> |---|---|
> | `EventEngagementTracking` | Mapped: `DbSet` at line 273 |
> | `EventAnalyticsMetrics` | Mapped: `DbSet` at line 278 |
> | `MemberEventEngagementScores` | Mapped: `DbSet` at line 298 |
> | `EventCancellationTracking` | Entity class exists, **no `DbSet`**: unmapped |
> | `EventSignUpTimingAnalysis` | Entity class exists, **no `DbSet`**: unmapped |
> | `FeatureAccessControl` | Entity class exists, **no `DbSet`**: unmapped |
> | `EventSatisfactionCorrelations` | **No entity class and no `DbSet`**: it was only ever a heading here |
>
> The four tables the original draft marked "(NEW)" are exactly the four that never landed. Three
> of them are on the README's list of eleven unmapped domain entities, so this is the same gap seen
> from the schema side. Everything below is the spec as written; read it as intent, and use the
> table above for what the database really has.

## Overview

This document outlines the comprehensive database schema for Event Engagement Analysis in
GatherGrove, designed to track member behavior patterns, no-show predictions, and event
satisfaction correlations.

## Core Tables

### 1. EventEngagementTracking
**Purpose**: Comprehensive tracking of individual member engagement for specific events

**Key Features**:
- Real-time attendance tracking with check-in/out timestamps
- Participation scoring with multiple engagement metrics
- Technology usage and connection quality monitoring
- Behavioral analytics including focus score and multitasking detection

**Indexes**:
- `IX_EventEngagementTrackings_EventId_MemberId` (Unique)
- `IX_EventEngagementTrackings_MemberId_ParticipationScore`
- `IX_EventEngagementTrackings_ParticipationLevel`
- `IX_EventEngagementTrackings_CreatedAt`

### 2. EventAnalyticsMetrics
**Purpose**: Aggregated analytics metrics for events

**Key Features**:
- Overall event performance metrics (attendance rate, no-show rate)
- Participation distribution analysis
- Technology usage patterns
- Member engagement impact measurement

**Indexes**:
- `IX_EventAnalyticsMetrics_EventId` (Unique)
- `IX_EventAnalyticsMetrics_AttendanceRate`
- `IX_EventAnalyticsMetrics_EventSuccessScore`
- `IX_EventAnalyticsMetrics_ClubId_CalculatedAt`

### 3. MemberEventEngagementScores
**Purpose**: Member-specific event engagement scoring and patterns

**Key Features**:
- Long-term engagement trend analysis
- Event preference tracking
- Predictive retention probability
- Social engagement scoring

**Indexes**:
- `IX_MemberEventEngagementScores_MemberId` (Unique)
- `IX_MemberEventEngagementScores_AverageEventEngagementScore`
- `IX_MemberEventEngagementScores_EngagementTrend`
- `IX_MemberEventEngagementScores_RiskLevel`

## Schema Extensions Needed

Based on the requirements for enhanced tracking, the following additional tables are recommended:

### 4. EventCancellationTracking (NEW)
**Purpose**: Track member cancellations and no-show patterns for predictive analytics

### 5. EventSignUpTimingAnalysis (NEW)
**Purpose**: Analyze sign-up timing patterns and early bird behavior

### 6. EventSatisfactionCorrelations (NEW)
**Purpose**: Track correlations between event characteristics and satisfaction

### 7. FeatureAccessControl (NEW)
**Purpose**: Control unlimited tier feature access

## Entity Relationship Diagram

Superseded by the mermaid diagrams in
[ENGAGEMENT-ANALYTICS-ERD.md](./ENGAGEMENT-ANALYTICS-ERD.md): a high-level relationship diagram
(entities and cardinalities) plus per-entity attribute tables, covering the same ground this
section's ASCII sketch used to.

## Performance Considerations

### Indexing Strategy
1. **Composite indexes** for common query patterns
2. **Covering indexes** for frequently accessed columns
3. **Partial indexes** for filtered queries on status fields
4. **Time-series indexes** for analytics queries

### Query Optimization
1. **Materialized views** for complex aggregations
2. **Partitioning** by date for large historical data
3. **Computed columns** for frequently calculated metrics
4. **Stored procedures** for complex analytics operations

## Data Retention and Archival

### Retention Policies
- **EventEngagementTracking**: 2 years active, then archive
- **EventAnalyticsMetrics**: Permanent retention for trends
- **Raw tracking data**: 6 months hot, 18 months warm, then cold storage

### Archival Strategy
- Monthly archival jobs for old engagement tracking data
- Quarterly aggregation of historical metrics
- Annual cleanup of cancelled/deleted events

## Security and Privacy

### Data Protection
- Anonymization of member data in analytics
- GDPR-compliant data deletion procedures
- Audit trails for sensitive data access

### Access Control
- Role-based access to analytics dashboards
- Tier-based feature restrictions
- API rate limiting for data exports

## Monitoring and Alerting

### Performance Metrics
- Query execution times for analytics operations
- Index usage statistics
- Storage growth patterns

### Data Quality Alerts
- Missing engagement data for events
- Unusual participation patterns
- Data consistency checks
