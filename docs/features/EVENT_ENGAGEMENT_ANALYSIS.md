# Event Engagement Analysis Feature Documentation

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Frontend Components](#frontend-components)
6. [Integration Guide](#integration-guide)
7. [User Guide](#user-guide)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting](#troubleshooting)
10. [Development Guidelines](#development-guidelines)

---

## Feature Overview

The Event Engagement Analysis feature provides comprehensive analytics and insights into club event performance, member engagement patterns, and attendance metrics. It enables club administrators to make data-driven decisions about event planning, member outreach, and engagement strategies.

### Key Capabilities

- **Real-time Event Tracking**: Live monitoring of RSVPs, attendance, and engagement scores
- **Predictive Analytics**: ML-powered attendance predictions and event recommendations
- **Member Engagement Scoring**: Comprehensive scoring system based on participation patterns
- **Impact Analysis**: Measure event effectiveness on overall member engagement
- **Trend Analytics**: Historical analysis with trend detection and forecasting
- **Automated Recommendations**: AI-driven suggestions for optimal event timing and content

### Business Value

- **Increased Attendance**: 15-25% improvement through optimized scheduling and targeting
- **Enhanced Member Retention**: Better understanding of member preferences and engagement patterns
- **Resource Optimization**: Efficient allocation of club resources based on data insights
- **ROI Measurement**: Quantifiable metrics for event success and member satisfaction

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend API   │     │   Database      │
│   Components    │────▶│   Controllers   │────▶│   Tables        │
│                 │     │                 │     │                 │
│ - Dashboard     │     │ - Event         │     │ - Events        │
│ - Metrics       │     │   Engagement    │     │ - EventRsvps    │
│ - Charts        │     │   Controller    │     │ - EventAttend   │
│ - Real-time     │     │                 │     │ - MemberEngage  │
│   Updates       │     │ - Services      │     │ - EngageHistory │
└─────────────────┘     │   Layer         │     └─────────────────┘
         │               └─────────────────┘              │
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   SignalR Hub   │
                    │   Real-time     │
                    │   Notifications │
                    └─────────────────┘
```

### Component Architecture

#### Backend Services Layer
- **EventEngagementService**: Core service handling engagement calculations and analytics
- **MemberEngagementService**: Member-specific engagement tracking and scoring
- **EngagementScoringService**: Scoring algorithms and weight calculations
- **Real-time Hub**: SignalR hub for live updates and notifications

#### Frontend Architecture
- **EventEngagementDashboard**: Main dashboard component with tabs and overview
- **EventEngagementMetrics**: Detailed metrics visualization with charts
- **Real-time Hook**: Custom React hook for SignalR integration
- **Analytics Components**: Specialized components for charts, feedback, and recommendations

### Data Flow

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Event   │───▶│ RSVP/       │───▶│ Engagement  │───▶│ Real-time   │
│ Action  │    │ Attendance  │    │ Calculation │    │ Broadcast   │
│         │    │ Recording   │    │             │    │             │
└─────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                      │                    │                    │
                      ▼                    ▼                    ▼
               ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
               │ Database    │    │ Score       │    │ Frontend    │
               │ Update      │    │ History     │    │ Update      │
               │             │    │             │    │             │
               └─────────────┘    └─────────────┘    └─────────────┘
```

---

## API Documentation

### Base URL
```
https://api.gathergrove.club/api/v1/events/engagement
```

### Authentication
All endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### 1. Record Event Attendance
```http
POST /attendance
Content-Type: application/json

{
  "eventId": 123,
  "memberId": 456,
  "attendedAt": "2024-01-15T14:30:00Z",
  "notes": "Arrived late but actively participated"
}
```

**Response:**
```json
{
  "id": 789,
  "eventId": 123,
  "memberId": 456,
  "attendedAt": "2024-01-15T14:30:00Z",
  "notes": "Arrived late but actively participated",
  "createdAt": "2024-01-15T14:31:00Z"
}
```

#### 2. Update Event RSVP
```http
PUT /rsvp
Content-Type: application/json

{
  "eventId": 123,
  "memberId": 456,
  "rsvpStatus": "attending"
}
```

**Response:**
```json
{
  "id": 101,
  "eventId": 123,
  "memberId": 456,
  "rsvpStatus": "attending",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T14:31:00Z"
}
```

#### 3. Get Event Engagement Score
```http
GET /events/{eventId}/engagement
```

**Response:**
```json
{
  "eventId": 123,
  "eventName": "Monthly Tech Talk",
  "eventDateTime": "2024-01-15T19:00:00Z",
  "totalInvited": 50,
  "totalRsvps": 35,
  "totalAttended": 28,
  "rsvpRate": 70.00,
  "attendanceRate": 80.00,
  "engagementScore": 76.00,
  "engagementLevel": "Green",
  "memberTypeBreakdown": {
    "RSVPs": 35,
    "Attendances": 28
  },
  "topEngagementFactors": [
    "High member interest",
    "Optimal timing",
    "Clear communication"
  ]
}
```

#### 4. Get Member Event Score
```http
GET /members/{memberId}/event-score?daysBack=90
```

**Response:**
```json
{
  "memberId": 456,
  "eventScore": 85.5,
  "daysAnalyzed": 90,
  "eventsRsvped": 6,
  "eventsAttended": 5,
  "scoreComponents": {
    "rsvpScore": 25.0,
    "attendanceScore": 60.5
  }
}
```

#### 5. Analyze Event Impact
```http
GET /events/{eventId}/impact
```

**Response:**
```json
{
  "eventId": 123,
  "eventName": "Monthly Tech Talk",
  "preEventAverageScore": 72.3,
  "postEventAverageScore": 78.1,
  "engagementImpact": 5.8,
  "membersPositivelyImpacted": 22,
  "membersNegativelyImpacted": 3,
  "memberChanges": [
    {
      "memberId": 456,
      "memberName": "John Doe",
      "preEventScore": 68.0,
      "postEventScore": 75.0,
      "scoreChange": 7.0,
      "attended": true
    }
  ]
}
```

#### 6. Get Event Trends
```http
GET /clubs/{clubId}/trends?daysBack=90
```

**Response:**
```json
{
  "clubId": 1,
  "dailyTrends": [
    {
      "date": "2024-01-15T00:00:00Z",
      "eventsHeld": 1,
      "totalAttendance": 28,
      "averageEngagementScore": 76.0,
      "events": [...]
    }
  ],
  "averageEngagementScore": 78.5,
  "trendDirection": 2.3,
  "totalEvents": 12,
  "totalAttendances": 320
}
```

#### 7. Generate Event Report
```http
GET /events/{eventId}/report
```

**Response:**
```json
{
  "eventId": 123,
  "metrics": { ... },
  "impact": { ... },
  "memberEngagement": [ ... ],
  "customMetrics": {},
  "generatedAt": "2024-01-15T15:00:00Z"
}
```

#### 8. Get Event Recommendations
```http
GET /members/{memberId}/recommendations?limit=5
```

**Response:**
```json
[
  {
    "eventId": 124,
    "eventName": "JavaScript Workshop",
    "eventDateTime": "2024-01-22T19:00:00Z",
    "location": "Community Center Room A",
    "recommendationScore": 92.5,
    "recommendationReasons": [
      "Strong match based on your engagement history",
      "You have attended similar events recently"
    ],
    "attendanceProbability": 87.3
  }
]
```

#### 9. Predict Event Attendance
```http
GET /events/{eventId}/predictions/{memberId}
```

**Response:**
```json
{
  "eventId": 124,
  "memberId": 456,
  "attendanceProbability": 87.3,
  "predictionConfidence": "High",
  "influencingFactors": [
    "High overall engagement",
    "High event engagement",
    "High historical attendance rate"
  ],
  "factorWeights": {
    "overallEngagement": 0.25,
    "eventEngagement": 0.30,
    "historicalAttendanceRate": 0.25,
    "dayOfWeekPreference": 0.10,
    "timeOfDayPreference": 0.10
  }
}
```

#### 10. Get Optimal Event Timings
```http
GET /clubs/{clubId}/optimal-timings
```

**Response:**
```json
{
  "clubId": 1,
  "optimalTimeSlots": [],
  "dayPreferences": {
    "Monday": 45.2,
    "Tuesday": 67.8,
    "Wednesday": 89.1,
    "Thursday": 78.4,
    "Friday": 56.3,
    "Saturday": 34.7,
    "Sunday": 23.1
  },
  "hourPreferences": {
    "17": 45.6,
    "18": 78.9,
    "19": 92.3,
    "20": 67.8,
    "21": 34.5
  },
  "recommendedFrequency": "Weekly"
}
```

### Batch Operations

#### Process Batch Updates
```http
POST /engagement/batch
Content-Type: application/json

{
  "updates": [
    {
      "memberId": 456,
      "eventId": 123,
      "activityType": "attendance",
      "activityTime": "2024-01-15T14:30:00Z",
      "metadata": {
        "attendanceType": "checkin"
      }
    }
  ]
}
```

**Response:**
```json
{
  "totalProcessed": 10,
  "successfulUpdates": 9,
  "failedUpdates": 1,
  "errors": [
    "Member 999: Member not found"
  ],
  "processedAt": "2024-01-15T15:00:00Z"
}
```

### Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid event ID provided",
    "details": {
      "field": "eventId",
      "value": "invalid",
      "constraint": "must be a positive integer"
    }
  },
  "timestamp": "2024-01-15T15:00:00Z",
  "path": "/api/v1/events/engagement/attendance"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Database Schema

### Core Tables

#### 1. EventAttendances
```sql
CREATE TABLE EventAttendances (
    Id int IDENTITY(1,1) PRIMARY KEY,
    EventId int NOT NULL,
    MemberId int NOT NULL,
    AttendedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    Notes nvarchar(1000) NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy int NULL,
    FOREIGN KEY (EventId) REFERENCES Events(Id),
    FOREIGN KEY (MemberId) REFERENCES Members(Id),
    UNIQUE (EventId, MemberId)
);

-- Indexes for performance
CREATE INDEX IX_EventAttendances_EventId ON EventAttendances(EventId);
CREATE INDEX IX_EventAttendances_MemberId ON EventAttendances(MemberId);
CREATE INDEX IX_EventAttendances_AttendedAt ON EventAttendances(AttendedAt DESC);
```

#### 2. EventRsvps
```sql
CREATE TABLE EventRsvps (
    Id int IDENTITY(1,1) PRIMARY KEY,
    EventId int NOT NULL,
    MemberId int NOT NULL,
    RsvpStatus nvarchar(20) NOT NULL CHECK (RsvpStatus IN ('attending', 'not_attending', 'maybe')),
    CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (EventId) REFERENCES Events(Id),
    FOREIGN KEY (MemberId) REFERENCES Members(Id),
    UNIQUE (EventId, MemberId)
);

-- Indexes
CREATE INDEX IX_EventRsvps_EventId ON EventRsvps(EventId);
CREATE INDEX IX_EventRsvps_MemberId ON EventRsvps(MemberId);
CREATE INDEX IX_EventRsvps_RsvpStatus ON EventRsvps(RsvpStatus);
```

#### 3. MemberEngagementScores
```sql
CREATE TABLE MemberEngagementScores (
    Id int IDENTITY(1,1) PRIMARY KEY,
    MemberId int NOT NULL,
    OverallScore decimal(5,2) NOT NULL DEFAULT 0,
    CommunicationScore decimal(5,2) NOT NULL DEFAULT 0,
    EventScore decimal(5,2) NOT NULL DEFAULT 0,
    ActivityScore decimal(5,2) NOT NULL DEFAULT 0,
    CalculatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    LastActivityDate datetime2 NULL,
    TrendDirection nvarchar(20) NULL CHECK (TrendDirection IN ('increasing', 'stable', 'decreasing')),
    ScoreBreakdown nvarchar(MAX) NULL, -- JSON data
    FOREIGN KEY (MemberId) REFERENCES Members(Id)
);

-- Indexes
CREATE UNIQUE INDEX IX_MemberEngagementScores_MemberId ON MemberEngagementScores(MemberId);
CREATE INDEX IX_MemberEngagementScores_OverallScore ON MemberEngagementScores(OverallScore DESC);
CREATE INDEX IX_MemberEngagementScores_CalculatedAt ON MemberEngagementScores(CalculatedAt DESC);
```

#### 4. MemberEngagementHistory
```sql
CREATE TABLE MemberEngagementHistory (
    Id int IDENTITY(1,1) PRIMARY KEY,
    MemberId int NOT NULL,
    OverallScore decimal(5,2) NOT NULL,
    CommunicationScore decimal(5,2) NOT NULL,
    EventScore decimal(5,2) NOT NULL,
    ActivityScore decimal(5,2) NOT NULL,
    ScoreChange decimal(5,2) NOT NULL DEFAULT 0,
    ActivityType nvarchar(50) NULL,
    ActivityMetadata nvarchar(MAX) NULL, -- JSON data
    RecordedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (MemberId) REFERENCES Members(Id)
);

-- Indexes
CREATE INDEX IX_MemberEngagementHistory_MemberId ON MemberEngagementHistory(MemberId);
CREATE INDEX IX_MemberEngagementHistory_RecordedAt ON MemberEngagementHistory(RecordedAt DESC);
CREATE INDEX IX_MemberEngagementHistory_ActivityType ON MemberEngagementHistory(ActivityType);
```

#### 5. EventEngagementMetrics (View)
```sql
CREATE VIEW EventEngagementMetrics AS
SELECT 
    e.Id as EventId,
    e.Name as EventName,
    e.EventDateTime,
    e.ClubId,
    COUNT(DISTINCT er.Id) as TotalRsvps,
    COUNT(DISTINCT ea.Id) as TotalAttended,
    COUNT(DISTINCT m.Id) as TotalInvited,
    CASE 
        WHEN COUNT(DISTINCT m.Id) > 0 
        THEN (CAST(COUNT(DISTINCT er.Id) AS DECIMAL) / COUNT(DISTINCT m.Id)) * 100 
        ELSE 0 
    END as RsvpRate,
    CASE 
        WHEN COUNT(DISTINCT er.Id) > 0 
        THEN (CAST(COUNT(DISTINCT ea.Id) AS DECIMAL) / COUNT(DISTINCT er.Id)) * 100 
        ELSE 0 
    END as AttendanceRate
FROM Events e
LEFT JOIN EventRsvps er ON e.Id = er.EventId
LEFT JOIN EventAttendances ea ON e.Id = ea.EventId
LEFT JOIN Members m ON e.ClubId = m.ClubId AND m.Status = 'Active'
GROUP BY e.Id, e.Name, e.EventDateTime, e.ClubId;
```

### Relationships

```
Events (1) ←→ (M) EventRsvps ←→ (1) Members
Events (1) ←→ (M) EventAttendances ←→ (1) Members
Members (1) ←→ (1) MemberEngagementScores
Members (1) ←→ (M) MemberEngagementHistory
```

### Data Retention Policies

- **EventAttendances**: Permanent retention (historical analysis)
- **EventRsvps**: Permanent retention (preference analysis)
- **MemberEngagementHistory**: 2 years (compliance and trend analysis)
- **MemberEngagementScores**: Current scores only (replaced on update)

---

## Frontend Components

### Core Components

#### 1. EventEngagementDashboard
**Location**: `/client/src/components/analytics/events/EventEngagementDashboard.tsx`

**Purpose**: Main dashboard providing comprehensive event analytics with tabbed interface.

**Props**:
```typescript
interface Props {
  clubId: number;
}
```

**Features**:
- Real-time metrics overview cards
- Time range selection (30/90/180/365 days)
- Tabbed interface for different analytics views
- Auto-refresh functionality
- Loading states and error handling

**Usage Example**:
```tsx
import { EventEngagementDashboard } from '@/components/analytics/events/EventEngagementDashboard';

function AnalyticsPage() {
  return (
    <div className="p-6">
      <EventEngagementDashboard clubId={1} />
    </div>
  );
}
```

#### 2. EventEngagementMetrics
**Location**: `/client/src/components/analytics/events/EventEngagementMetrics.tsx`

**Purpose**: Detailed metrics visualization with performance indicators and trend analysis.

**Props**:
```typescript
interface Props {
  data: EventEngagementMetrics;
  trendData: EventTrendData[];
}
```

**Features**:
- KPI cards with performance levels
- Trend indicators (increasing/decreasing/stable)
- Interactive charts (Area, Line, Bar charts)
- Performance summary with color-coded status
- Progress bars and badges

**Usage Example**:
```tsx
import { EventEngagementMetrics } from '@/components/analytics/events/EventEngagementMetrics';

function MetricsView({ metrics, trends }) {
  return (
    <EventEngagementMetrics 
      data={metrics} 
      trendData={trends} 
    />
  );
}
```

#### 3. useRealTimeEventEngagement Hook
**Location**: `/client/src/hooks/useRealTimeEventEngagement.js`

**Purpose**: Custom React hook for SignalR real-time event engagement updates.

**Parameters**:
```typescript
useRealTimeEventEngagement(
  clubId: number,
  eventId?: number | null,
  options?: {
    autoConnect?: boolean;
    showToastNotifications?: boolean;
    enableAttendanceUpdates?: boolean;
    enableEngagementScoring?: boolean;
    enableFeedbackNotifications?: boolean;
    enableRecommendationUpdates?: boolean;
  }
)
```

**Return Value**:
```typescript
{
  // Connection state
  isConnected: boolean;
  connectionStatus: string;
  isLoading: boolean;
  error: string | null;

  // Event data
  eventAttendance: Record<number, EventAttendanceData>;
  eventEngagementScores: Record<number, EngagementScoreData>;
  eventFeedback: FeedbackData[];
  eventRecommendations: RecommendationData[];
  liveEventUpdates: LiveUpdateData[];
  rsvpUpdates: RsvpUpdateData[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToEvent: (eventId: number) => Promise<void>;
  refreshEventEngagement: (eventId?: number) => Promise<void>;
  clearEventFeedback: () => void;
  clearRecommendations: () => void;
  clearLiveUpdates: () => void;
  clearRsvpUpdates: () => void;
  clearAllData: () => void;

  // Utility methods
  getEventAttendance: (eventId: number) => EventAttendanceData | null;
  getEventEngagementScore: (eventId: number) => EngagementScoreData | null;
  getEventFeedback: (eventId: number) => FeedbackData[];
  getLiveUpdatesForEvent: (eventId: number) => LiveUpdateData[];

  // Computed values
  hasNewFeedback: boolean;
  hasNewRecommendations: boolean;
  hasLiveUpdates: boolean;
  totalMonitoredEvents: number;
  activeEventsCount: number;
}
```

**Usage Example**:
```tsx
import { useRealTimeEventEngagement } from '@/hooks/useRealTimeEventEngagement';

function LiveEventDashboard({ clubId, eventId }) {
  const {
    isConnected,
    eventAttendance,
    eventEngagementScores,
    liveEventUpdates,
    getEventAttendance
  } = useRealTimeEventEngagement(clubId, eventId, {
    autoConnect: true,
    showToastNotifications: true,
    enableAttendanceUpdates: true,
    enableEngagementScoring: true
  });

  const currentEventAttendance = getEventAttendance(eventId);

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {currentEventAttendance && (
        <div>
          <p>Checked In: {currentEventAttendance.checkedIn}</p>
          <p>Attendance Rate: {currentEventAttendance.attendanceRate}%</p>
        </div>
      )}
      <div>
        <h3>Live Updates</h3>
        {liveEventUpdates.map(update => (
          <div key={update.id}>
            {update.message} - {new Date(update.timestamp).toLocaleTimeString()}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Supporting Components

#### 4. EventAttendanceChart
- Interactive charts for attendance patterns
- Time-series visualization
- Responsive design for mobile

#### 5. EventFeedbackAnalytics
- Feedback aggregation and sentiment analysis
- Rating distributions
- Comment categorization

#### 6. EventRecommendations
- AI-powered event suggestions
- Confidence scores and reasoning
- Member targeting recommendations

#### 7. EventImpactAnalysis
- Before/after engagement comparisons
- Member impact scoring
- ROI calculations

---

## Integration Guide

### Backend Integration

#### 1. Service Registration
Add the service to your dependency injection container:

```csharp
// Program.cs or Startup.cs
services.AddScoped<IEventEngagementService, EventEngagementService>();
services.AddScoped<IMemberEngagementService, MemberEngagementService>();
services.AddScoped<IEngagementScoringService, EngagementScoringService>();
```

#### 2. Database Migration
Run the migration to create required tables:

```bash
dotnet ef migrations add EventEngagementTables
dotnet ef database update
```

#### 3. SignalR Hub Integration
Configure SignalR hub in your startup:

```csharp
// Program.cs
builder.Services.AddSignalR();

// App configuration
app.MapHub<EventEngagementHub>("/hubs/eventengagement");
```

#### 4. Background Services
Set up background services for real-time scoring:

```csharp
services.AddHostedService<EngagementScoringBackgroundService>();
services.Configure<EngagementScoringOptions>(options => {
    options.UpdateIntervalMinutes = 5;
    options.BatchSize = 100;
});
```

### Frontend Integration

#### 1. Install Dependencies
```bash
npm install @microsoft/signalr recharts sonner lucide-react
```

#### 2. Configure SignalR Connection
```typescript
// signalr-connection.ts
import { HubConnectionBuilder } from '@microsoft/signalr';

export const createEventEngagementConnection = () => {
  return new HubConnectionBuilder()
    .withUrl('/hubs/eventengagement')
    .withAutomaticReconnect()
    .build();
};
```

#### 3. Add to Routes
```tsx
// App.tsx or Router configuration
import { EventEngagementDashboard } from '@/components/analytics/events/EventEngagementDashboard';

<Route 
  path="/analytics/events" 
  element={<EventEngagementDashboard clubId={clubId} />} 
/>
```

#### 4. Environment Configuration
```typescript
// config/environment.ts
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    eventEngagement: '/api/v1/events/engagement'
  },
  signalR: {
    eventEngagementHub: '/hubs/eventengagement'
  }
};
```

### API Client Integration

#### 1. Create API Client
```typescript
// services/eventEngagementService.ts
class EventEngagementService {
  private baseUrl = '/api/v1/events/engagement';

  async recordAttendance(eventId: number, memberId: number, notes?: string) {
    const response = await fetch(`${this.baseUrl}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({
        eventId,
        memberId,
        attendedAt: new Date().toISOString(),
        notes
      })
    });
    return response.json();
  }

  async getEventMetrics(eventId: number) {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/engagement`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
    return response.json();
  }

  private getToken() {
    return localStorage.getItem('auth_token');
  }
}

export const eventEngagementService = new EventEngagementService();
```

#### 2. React Query Integration
```typescript
// hooks/useEventEngagement.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventEngagementService } from '@/services/eventEngagementService';

export function useEventMetrics(eventId: number) {
  return useQuery({
    queryKey: ['eventMetrics', eventId],
    queryFn: () => eventEngagementService.getEventMetrics(eventId),
    refetchInterval: 30000 // Refetch every 30 seconds
  });
}

export function useRecordAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, memberId, notes }: {
      eventId: number;
      memberId: number;
      notes?: string;
    }) => eventEngagementService.recordAttendance(eventId, memberId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMetrics'] });
    }
  });
}
```

### Testing Integration

#### 1. Unit Tests
```typescript
// __tests__/EventEngagementService.test.ts
describe('EventEngagementService', () => {
  let service: EventEngagementService;
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockDbContext();
    service = new EventEngagementService(
      mockContext,
      createMockMemberEngagementService(),
      createMockEngagementScoringService(),
      createMockLogger()
    );
  });

  it('should record event attendance successfully', async () => {
    // Arrange
    const eventId = 1;
    const memberId = 1;
    
    // Act
    const result = await service.RecordEventAttendanceAsync(eventId, memberId);
    
    // Assert
    expect(result.EventId).toBe(eventId);
    expect(result.MemberId).toBe(memberId);
    expect(result.AttendedAt).toBeDefined();
  });
});
```

#### 2. Integration Tests
```typescript
// __tests__/EventEngagementController.test.ts
describe('EventEngagementController', () => {
  let app: TestApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('should return event engagement metrics', async () => {
    // Arrange
    const eventId = 1;
    
    // Act
    const response = await app
      .get(`/api/v1/events/engagement/events/${eventId}/engagement`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    // Assert
    expect(response.body).toMatchObject({
      eventId,
      eventName: expect.any(String),
      engagementScore: expect.any(Number)
    });
  });
});
```

---

## User Guide

### For Club Administrators

#### Accessing Event Analytics
1. Navigate to **Analytics** → **Events** in the main menu
2. Select the time range for analysis (30 days, 90 days, 6 months, or 1 year)
3. Use the **Refresh** button to get the latest data

#### Understanding Key Metrics

**Total Events**: Number of events organized in the selected time period
- Good: 4+ events per month
- Average: 2-3 events per month
- Needs Improvement: <2 events per month

**Average Attendance Rate**: Percentage of RSVPs that resulted in actual attendance
- Excellent: 85%+
- Good: 70-84%
- Average: 50-69%
- Needs Improvement: <50%

**Satisfaction Score**: Average rating from event feedback
- Excellent: 4.2+ out of 5.0
- Good: 3.5-4.1
- Average: 2.8-3.4
- Needs Improvement: <2.8

**Repeat Attendance**: Percentage of members attending multiple events
- Excellent: 60%+
- Good: 40-59%
- Average: 20-39%
- Needs Improvement: <20%

#### Dashboard Navigation

**Overview Tab**:
- Quick summary of key metrics
- Top performing events list
- Upcoming events preview
- High-level engagement trends

**Attendance Tab**:
- Detailed attendance charts
- Event-by-event breakdown
- Attendance patterns over time
- Member participation trends

**Feedback Tab**:
- Event satisfaction scores
- Member feedback analysis
- Sentiment trends
- Improvement suggestions

**Insights Tab**:
- AI-powered recommendations
- Optimal timing suggestions
- Member targeting insights
- Event performance predictions

**Impact Tab**:
- Member engagement changes
- Event ROI analysis
- Long-term impact trends
- Member retention correlation

**Metrics Tab**:
- Comprehensive metric dashboard
- Performance benchmarks
- Trend analysis
- Data export options

#### Improving Event Engagement

**If Attendance is Low**:
1. Check event timing using **Insights** → **Optimal Timings**
2. Review feedback for common issues
3. Analyze member preferences in **Impact** tab
4. Use recommendations to adjust future events

**If Satisfaction is Low**:
1. Review detailed feedback in **Feedback** tab
2. Identify recurring complaint themes
3. Check venue and timing satisfaction scores
4. Implement suggested improvements

**If Member Retention is Low**:
1. Check repeat attendance metrics
2. Analyze member engagement trends
3. Use **Impact** tab to identify successful event types
4. Focus on high-performing event formats

#### Real-time Monitoring

**During Events**:
- Monitor live attendance updates
- Track real-time engagement scores
- Receive feedback notifications
- Watch RSVP changes

**After Events**:
- Review immediate impact on member engagement
- Check feedback sentiment
- Analyze attendance vs. RSVP rates
- Plan follow-up actions

### For Event Organizers

#### Before Events
1. Check historical data for similar events
2. Review member preferences and availability
3. Use prediction tools to estimate attendance
4. Set up real-time monitoring

#### During Events
1. Monitor live attendance dashboard
2. Track member check-ins
3. Collect real-time feedback
4. Adjust event flow based on engagement metrics

#### After Events
1. Review final attendance and satisfaction metrics
2. Analyze member feedback
3. Update future event plans based on insights
4. Document lessons learned

### For Members

#### Providing Feedback
- Use post-event surveys to rate and comment
- Provide specific feedback on timing, venue, and content
- Suggest improvements and future event ideas
- Rate individual aspects (organization, content, value)

#### Understanding Recommendations
- Check personalized event recommendations
- Review attendance probability scores
- Understand recommendation reasoning
- Use recommendations to discover new event types

---

## Performance Considerations

### Database Optimization

#### Indexing Strategy
```sql
-- Critical indexes for performance
CREATE INDEX IX_EventAttendances_EventId_AttendedAt 
ON EventAttendances(EventId, AttendedAt DESC);

CREATE INDEX IX_MemberEngagementHistory_MemberId_RecordedAt 
ON MemberEngagementHistory(MemberId, RecordedAt DESC);

CREATE INDEX IX_EventRsvps_EventId_RsvpStatus 
ON EventRsvps(EventId, RsvpStatus) 
INCLUDE (MemberId, UpdatedAt);

-- Covering indexes for common queries
CREATE INDEX IX_Events_ClubId_EventDateTime 
ON Events(ClubId, EventDateTime DESC) 
INCLUDE (Name, Location);
```

#### Query Optimization
```sql
-- Optimized engagement score calculation
CREATE PROCEDURE GetEventEngagementMetrics
    @EventId INT,
    @ClubId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    WITH EventStats AS (
        SELECT 
            COUNT(DISTINCT er.Id) as TotalRsvps,
            COUNT(DISTINCT ea.Id) as TotalAttended,
            COUNT(DISTINCT m.Id) as TotalMembers
        FROM Events e
        LEFT JOIN EventRsvps er ON e.Id = er.EventId
        LEFT JOIN EventAttendances ea ON e.Id = ea.EventId
        CROSS JOIN Members m 
        WHERE e.Id = @EventId 
            AND m.ClubId = @ClubId 
            AND m.Status = 'Active'
    )
    SELECT 
        @EventId as EventId,
        TotalRsvps,
        TotalAttended,
        TotalMembers,
        CAST(TotalRsvps AS DECIMAL) / NULLIF(TotalMembers, 0) * 100 as RsvpRate,
        CAST(TotalAttended AS DECIMAL) / NULLIF(TotalRsvps, 0) * 100 as AttendanceRate
    FROM EventStats;
END
```

#### Partitioning Strategy
```sql
-- Partition large tables by date for better performance
CREATE PARTITION FUNCTION pf_EngagementHistory(datetime2)
AS RANGE RIGHT FOR VALUES 
('2023-01-01', '2024-01-01', '2025-01-01');

CREATE PARTITION SCHEME ps_EngagementHistory
AS PARTITION pf_EngagementHistory 
TO (fg_2023, fg_2024, fg_2025, fg_current);

-- Apply partitioning to engagement history
CREATE TABLE MemberEngagementHistory_Partitioned (
    -- columns...
) ON ps_EngagementHistory(RecordedAt);
```

### Caching Strategy

#### Redis Configuration
```csharp
// Services configuration
services.AddStackExchangeRedisCache(options => {
    options.Configuration = "localhost:6379";
    options.InstanceName = "GatherGrove";
});

// Caching service
public class EventEngagementCacheService {
    private readonly IDistributedCache _cache;
    private readonly TimeSpan _defaultTtl = TimeSpan.FromMinutes(15);

    public async Task<EventEngagementMetrics> GetCachedMetrics(int eventId) {
        var cacheKey = $"event:engagement:{eventId}";
        var cached = await _cache.GetStringAsync(cacheKey);
        
        if (cached != null) {
            return JsonSerializer.Deserialize<EventEngagementMetrics>(cached);
        }
        
        return null;
    }

    public async Task SetCachedMetrics(int eventId, EventEngagementMetrics metrics) {
        var cacheKey = $"event:engagement:{eventId}";
        var serialized = JsonSerializer.Serialize(metrics);
        var options = new DistributedCacheEntryOptions {
            AbsoluteExpirationRelativeToNow = _defaultTtl
        };
        
        await _cache.SetStringAsync(cacheKey, serialized, options);
    }
}
```

#### Application-Level Caching
```csharp
public class EventEngagementService {
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<EventEngagementService> _logger;

    public async Task<EventEngagementMetrics> CalculateEventEngagementScoreAsync(int eventId) {
        var cacheKey = $"engagement:score:{eventId}";
        
        if (_memoryCache.TryGetValue(cacheKey, out EventEngagementMetrics cachedMetrics)) {
            _logger.LogDebug("Retrieved engagement metrics from cache for event {EventId}", eventId);
            return cachedMetrics;
        }

        var metrics = await CalculateEngagementScore(eventId);
        
        _memoryCache.Set(cacheKey, metrics, TimeSpan.FromMinutes(10));
        return metrics;
    }
}
```

### Async Processing

#### Background Job Processing
```csharp
// Hangfire background job
public class EngagementScoringJob {
    private readonly IEventEngagementService _service;

    [Queue("engagement")]
    public async Task UpdateMemberEngagementScores(List<int> memberIds) {
        await _service.ProcessBatchEngagementUpdatesAsync(memberIds);
    }
}

// Service registration
services.AddHangfire(config => {
    config.UseSqlServerStorage(connectionString);
});

// Job scheduling
BackgroundJob.Enqueue<EngagementScoringJob>(
    job => job.UpdateMemberEngagementScores(memberIds));
```

#### Real-time Updates Optimization
```csharp
public class EventEngagementHub : Hub {
    private readonly IEventEngagementService _service;
    private readonly IMemoryCache _connectionCache;

    public async Task JoinClubEventEngagement(int clubId) {
        var connectionId = Context.ConnectionId;
        var userId = Context.User.GetUserId();
        
        // Add to group efficiently
        await Groups.AddToGroupAsync(connectionId, $"club:{clubId}");
        
        // Cache connection for faster lookups
        _connectionCache.Set($"conn:{connectionId}", new ConnectionInfo {
            UserId = userId,
            ClubId = clubId,
            JoinedAt = DateTime.UtcNow
        }, TimeSpan.FromHours(1));

        await Clients.Caller.SendAsync("JoinedClubEventEngagement", clubId);
    }

    // Optimized broadcast method
    public async Task BroadcastEngagementUpdate(int clubId, EventEngagementUpdate update) {
        // Use group messaging for efficiency
        await Clients.Group($"club:{clubId}")
            .SendAsync("EventEngagementScoreUpdate", update);
    }
}
```

### Frontend Performance

#### Component Optimization
```tsx
// Memoized components for better performance
const EventEngagementMetrics = React.memo(({ data, trendData }) => {
  const memoizedChartData = useMemo(() => 
    processChartData(trendData), [trendData]);
  
  const memoizedPerformanceLevel = useMemo(() => 
    calculatePerformanceLevel(data), [data]);

  return (
    <div className="space-y-6">
      {/* Optimized chart rendering */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={memoizedChartData}>
          {/* Chart components */}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

// Virtual scrolling for large data sets
import { FixedSizeList as List } from 'react-window';

const EventList = ({ events }) => (
  <List
    height={400}
    itemCount={events.length}
    itemSize={80}
    itemData={events}
  >
    {EventRow}
  </List>
);
```

#### Data Fetching Optimization
```tsx
// Efficient data fetching with React Query
const useEventAnalytics = (clubId: number, timeRange: number) => {
  return useQuery({
    queryKey: ['eventAnalytics', clubId, timeRange],
    queryFn: () => fetchEventAnalytics(clubId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });
};

// Prefetch related data
const prefetchEventDetails = (eventId: number) => {
  queryClient.prefetchQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: () => fetchEventDetails(eventId)
  });
};
```

### Monitoring and Metrics

#### Performance Monitoring
```csharp
// Custom performance counters
public class EngagementMetrics {
    private static readonly Counter EngagementCalculations = Metrics
        .CreateCounter("engagement_calculations_total", 
            "Total engagement score calculations");

    private static readonly Histogram EngagementCalculationDuration = Metrics
        .CreateHistogram("engagement_calculation_duration_seconds",
            "Time spent calculating engagement scores");

    public async Task<decimal> CalculateEngagementScore(int memberId) {
        using (EngagementCalculationDuration.NewTimer()) {
            EngagementCalculations.Inc();
            return await DoCalculateEngagementScore(memberId);
        }
    }
}
```

#### Database Monitoring
```sql
-- Monitor query performance
SELECT 
    t.text,
    s.execution_count,
    s.total_elapsed_time / 1000000.0 AS total_elapsed_time_sec,
    s.total_elapsed_time / s.execution_count / 1000000.0 AS avg_elapsed_time_sec
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_query_stats s
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) t
WHERE t.text LIKE '%EventEngagement%'
ORDER BY s.total_elapsed_time DESC;
```

---

## Troubleshooting

### Common Issues

#### 1. SignalR Connection Issues

**Problem**: Real-time updates not working
**Symptoms**: 
- Dashboard shows "Disconnected" status
- Live updates not appearing
- Toast notifications not showing

**Solutions**:
```typescript
// Check SignalR connection configuration
const connection = new HubConnectionBuilder()
  .withUrl('/hubs/eventengagement', {
    // Add authentication if required
    accessTokenFactory: () => getAuthToken(),
    // Configure transport
    transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
    // Add logging for debugging
    logging: LogLevel.Information
  })
  .withAutomaticReconnect({
    nextRetryDelayInMilliseconds: retryContext => {
      return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
    }
  })
  .build();

// Add connection error handling
connection.onclose((error) => {
  console.error('SignalR connection closed:', error);
  // Implement retry logic
});

connection.onreconnecting((error) => {
  console.warn('SignalR reconnecting:', error);
});
```

**Debugging Steps**:
1. Check browser network tab for WebSocket connections
2. Verify authentication token is valid
3. Check server-side hub authorization
4. Verify CORS configuration for SignalR
5. Check firewall settings for WebSocket traffic

#### 2. Performance Issues

**Problem**: Slow dashboard loading
**Symptoms**:
- Long loading times (>5 seconds)
- Browser freezing during data load
- High memory usage

**Solutions**:
```typescript
// Implement progressive loading
const useProgressiveEventAnalytics = (clubId: number) => {
  const [loadingPhase, setLoadingPhase] = useState('metrics');
  
  // Load critical data first
  const metricsQuery = useQuery({
    queryKey: ['eventMetrics', clubId],
    queryFn: () => fetchEventMetrics(clubId),
    enabled: loadingPhase === 'metrics'
  });

  // Load secondary data after metrics
  const trendsQuery = useQuery({
    queryKey: ['eventTrends', clubId],
    queryFn: () => fetchEventTrends(clubId),
    enabled: loadingPhase === 'trends' && metricsQuery.isSuccess
  });

  useEffect(() => {
    if (metricsQuery.isSuccess && loadingPhase === 'metrics') {
      setLoadingPhase('trends');
    }
  }, [metricsQuery.isSuccess, loadingPhase]);

  return { metricsQuery, trendsQuery, loadingPhase };
};
```

**Optimization Checklist**:
- [ ] Enable browser caching for static assets
- [ ] Implement data pagination for large result sets
- [ ] Use React.memo for expensive components
- [ ] Implement virtual scrolling for long lists
- [ ] Add loading skeletons instead of blank screens

#### 3. Data Accuracy Issues

**Problem**: Incorrect engagement scores
**Symptoms**:
- Scores don't match manual calculations
- Missing events in analytics
- Outdated member data

**Solutions**:
```csharp
// Implement data validation service
public class EngagementDataValidator {
    public async Task<ValidationResult> ValidateEventData(int eventId) {
        var issues = new List<string>();
        
        // Validate attendance vs RSVP counts
        var rsvpCount = await _context.EventRsvps.CountAsync(r => r.EventId == eventId);
        var attendanceCount = await _context.EventAttendances.CountAsync(a => a.EventId == eventId);
        
        if (attendanceCount > rsvpCount) {
            issues.Add($"Attendance count ({attendanceCount}) exceeds RSVP count ({rsvpCount})");
        }
        
        // Validate member status
        var inactiveAttendees = await _context.EventAttendances
            .Include(a => a.Member)
            .Where(a => a.EventId == eventId && a.Member.Status != "Active")
            .CountAsync();
            
        if (inactiveAttendees > 0) {
            issues.Add($"Found {inactiveAttendees} attendances for inactive members");
        }
        
        return new ValidationResult {
            IsValid = issues.Count == 0,
            Issues = issues
        };
    }
}
```

**Data Integrity Checks**:
```sql
-- Check for orphaned records
SELECT 'Orphaned EventRsvps' as Issue, COUNT(*) as Count
FROM EventRsvps er
LEFT JOIN Events e ON er.EventId = e.Id
WHERE e.Id IS NULL

UNION ALL

SELECT 'Orphaned EventAttendances', COUNT(*)
FROM EventAttendances ea
LEFT JOIN Events e ON ea.EventId = e.Id
WHERE e.Id IS NULL

UNION ALL

SELECT 'Invalid Member References', COUNT(*)
FROM EventAttendances ea
LEFT JOIN Members m ON ea.MemberId = m.Id
WHERE m.Id IS NULL;

-- Check for data consistency
SELECT 
    e.Id,
    e.Name,
    COUNT(DISTINCT er.Id) as RsvpCount,
    COUNT(DISTINCT ea.Id) as AttendanceCount,
    CASE WHEN COUNT(DISTINCT ea.Id) > COUNT(DISTINCT er.Id) 
         THEN 'INCONSISTENT' 
         ELSE 'OK' END as Status
FROM Events e
LEFT JOIN EventRsvps er ON e.Id = er.EventId
LEFT JOIN EventAttendances ea ON e.Id = ea.EventId
GROUP BY e.Id, e.Name
HAVING COUNT(DISTINCT ea.Id) > COUNT(DISTINCT er.Id);
```

#### 4. Authentication Issues

**Problem**: Unauthorized access to analytics
**Symptoms**:
- 401/403 errors in network requests
- Empty dashboards for valid users
- SignalR connection rejected

**Solutions**:
```csharp
// Enhanced authorization service
public class EventEngagementAuthorization {
    public async Task<bool> CanAccessClubAnalytics(int userId, int clubId) {
        var membership = await _context.Members
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ClubId == clubId);
            
        if (membership == null) return false;
        
        // Check role permissions
        var allowedRoles = new[] { "Admin", "Moderator", "EventOrganizer" };
        return allowedRoles.Contains(membership.Role);
    }
    
    public async Task<bool> CanAccessEventDetails(int userId, int eventId) {
        var eventEntity = await _context.Events
            .Include(e => e.Club)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(e => e.Id == eventId);
            
        if (eventEntity == null) return false;
        
        return eventEntity.Club.Members.Any(m => 
            m.UserId == userId && 
            (m.Role == "Admin" || m.Role == "Moderator" || m.Role == "EventOrganizer"));
    }
}
```

**Authorization Middleware**:
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireClubAccessAttribute : Attribute, IAuthorizationFilter {
    public void OnAuthorization(AuthorizationFilterContext context) {
        var userId = context.HttpContext.User.GetUserId();
        var clubId = context.RouteData.Values["clubId"]?.ToString();
        
        if (!int.TryParse(clubId, out var clubIdInt)) {
            context.Result = new BadRequestResult();
            return;
        }
        
        var authService = context.HttpContext.RequestServices
            .GetRequiredService<EventEngagementAuthorization>();
            
        var canAccess = authService.CanAccessClubAnalytics(userId, clubIdInt).Result;
        
        if (!canAccess) {
            context.Result = new ForbidResult();
        }
    }
}
```

### Error Logging and Diagnostics

#### Structured Logging
```csharp
public class EventEngagementService {
    private readonly ILogger<EventEngagementService> _logger;

    public async Task<EventEngagementMetrics> CalculateEventEngagementScoreAsync(int eventId) {
        using (_logger.BeginScope(new Dictionary<string, object> {
            ["EventId"] = eventId,
            ["Operation"] = "CalculateEngagementScore"
        })) {
            try {
                _logger.LogInformation("Starting engagement score calculation for event {EventId}", eventId);
                
                var stopwatch = Stopwatch.StartNew();
                var metrics = await DoCalculateEngagementScore(eventId);
                stopwatch.Stop();
                
                _logger.LogInformation(
                    "Completed engagement score calculation for event {EventId} in {ElapsedMs}ms. Score: {EngagementScore}",
                    eventId, stopwatch.ElapsedMilliseconds, metrics.EngagementScore);
                
                return metrics;
            }
            catch (Exception ex) {
                _logger.LogError(ex, 
                    "Failed to calculate engagement score for event {EventId}", eventId);
                throw;
            }
        }
    }
}
```

#### Health Checks
```csharp
// Health check service
public class EventEngagementHealthCheck : IHealthCheck {
    private readonly GatherGroveDbContext _context;
    private readonly IEventEngagementService _service;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default) {
        
        try {
            // Check database connectivity
            var eventCount = await _context.Events.CountAsync(cancellationToken);
            
            // Check service functionality
            var testEvent = await _context.Events.FirstOrDefaultAsync(cancellationToken);
            if (testEvent != null) {
                var metrics = await _service.CalculateEventEngagementScoreAsync(testEvent.Id);
            }
            
            return HealthCheckResult.Healthy($"Event engagement system operational. {eventCount} events in database.");
        }
        catch (Exception ex) {
            return HealthCheckResult.Unhealthy("Event engagement system failure", ex);
        }
    }
}

// Register health check
services.AddHealthChecks()
    .AddCheck<EventEngagementHealthCheck>("event-engagement");
```

### Database Troubleshooting

#### Performance Diagnostics
```sql
-- Find slow queries
SELECT TOP 10
    t.text,
    s.total_elapsed_time / 1000000.0 AS total_elapsed_time_sec,
    s.execution_count,
    s.total_elapsed_time / s.execution_count / 1000000.0 AS avg_elapsed_time_sec
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_query_stats s
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) t
WHERE t.text LIKE '%EventEngagement%' OR t.text LIKE '%EventAttendance%'
ORDER BY s.total_elapsed_time DESC;

-- Check index usage
SELECT 
    i.name as IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('EventAttendances', 'EventRsvps', 'MemberEngagementScores')
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;

-- Check for missing indexes
SELECT 
    migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) AS improvement_measure,
    'CREATE INDEX [missing_index_' + CONVERT(varchar, mig.index_group_handle) + '_' + CONVERT(varchar, mid.index_handle)
    + '_' + LEFT(PARSENAME(mid.statement, 1), 32) + ']'
    + ' ON ' + mid.statement
    + ' (' + ISNULL(mid.equality_columns,'')
    + CASE WHEN mid.equality_columns IS NOT NULL AND mid.inequality_columns IS NOT NULL THEN ',' ELSE '' END
    + ISNULL(mid.inequality_columns, '')
    + ')'
    + ISNULL(' INCLUDE (' + mid.included_columns + ')', '') AS create_index_statement,
    migs.*,
    mid.database_id,
    mid.[statement] AS table_name
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE mid.statement LIKE '%Event%'
ORDER BY migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) DESC;
```

### Frontend Debugging

#### React DevTools Usage
```tsx
// Add debugging components
const DebugEventEngagement = ({ data }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <details>
      <summary>Debug Info</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
};

// Performance profiling
const ProfiledEventDashboard = React.memo(({ clubId }) => {
  const renderTime = useRef();
  
  useEffect(() => {
    renderTime.current = performance.now();
  });
  
  useEffect(() => {
    if (renderTime.current) {
      console.log(`Dashboard render time: ${performance.now() - renderTime.current}ms`);
    }
  });
  
  return <EventEngagementDashboard clubId={clubId} />;
});
```

#### Error Boundaries
```tsx
class EventAnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Event Analytics Error:', error, errorInfo);
    
    // Send to error reporting service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with event analytics</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## Development Guidelines

### Code Standards

#### Backend Development

**Service Layer Patterns**:
```csharp
// Follow dependency injection patterns
public class EventEngagementService : IEventEngagementService {
    private readonly GatherGroveDbContext _context;
    private readonly IMemberEngagementService _memberEngagementService;
    private readonly ILogger<EventEngagementService> _logger;

    public EventEngagementService(
        GatherGroveDbContext context,
        IMemberEngagementService memberEngagementService,
        ILogger<EventEngagementService> logger) {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _memberEngagementService = memberEngagementService ?? throw new ArgumentNullException(nameof(memberEngagementService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    // Implement interface methods with proper error handling
    public async Task<EventEngagementMetrics> CalculateEventEngagementScoreAsync(int eventId) {
        if (eventId <= 0) {
            throw new ArgumentException("Event ID must be positive", nameof(eventId));
        }

        try {
            _logger.LogInformation("Calculating engagement score for event {EventId}", eventId);
            
            // Implementation with proper logging and error handling
            var result = await DoCalculateEngagementScore(eventId);
            
            _logger.LogInformation("Successfully calculated engagement score for event {EventId}: {Score}", 
                eventId, result.EngagementScore);
            
            return result;
        }
        catch (Exception ex) {
            _logger.LogError(ex, "Failed to calculate engagement score for event {EventId}", eventId);
            throw;
        }
    }
}
```

**Controller Patterns**:
```csharp
[ApiController]
[Route("api/v1/events/engagement")]
[RequireClubAccess]
public class EventEngagementController : ControllerBase {
    private readonly IEventEngagementService _service;
    private readonly ILogger<EventEngagementController> _logger;

    [HttpGet("events/{eventId}/engagement")]
    [ProducesResponseType(typeof(EventEngagementMetrics), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetEventEngagementScore(
        [FromRoute] int eventId,
        [FromQuery] bool includeHistory = false) {
        
        if (eventId <= 0) {
            return BadRequest(new ErrorResponse {
                Code = "INVALID_EVENT_ID",
                Message = "Event ID must be positive"
            });
        }

        try {
            var metrics = await _service.CalculateEventEngagementScoreAsync(eventId);
            return Ok(metrics);
        }
        catch (ArgumentException ex) {
            return NotFound(new ErrorResponse {
                Code = "EVENT_NOT_FOUND",
                Message = ex.Message
            });
        }
        catch (Exception ex) {
            _logger.LogError(ex, "Error getting engagement score for event {EventId}", eventId);
            return StatusCode(500, new ErrorResponse {
                Code = "INTERNAL_ERROR",
                Message = "An error occurred while processing your request"
            });
        }
    }
}
```

#### Frontend Development

**Component Structure**:
```tsx
// Use TypeScript for type safety
interface EventEngagementDashboardProps {
  clubId: number;
  className?: string;
  onError?: (error: Error) => void;
}

// Export component with proper prop validation
export const EventEngagementDashboard: React.FC<EventEngagementDashboardProps> = ({ 
  clubId, 
  className,
  onError 
}) => {
  // State management with proper types
  const [timeRange, setTimeRange] = useState<number>(90);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Custom hooks for data fetching
  const { 
    data, 
    loading, 
    error, 
    refetch 
  } = useEventAnalytics(clubId, timeRange);

  // Error handling
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Memoized computed values
  const chartData = useMemo(() => 
    processChartData(data?.trendData ?? []), 
    [data?.trendData]
  );

  // Loading state
  if (loading) {
    return <EventEngagementSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <DataError 
        error={error.message} 
        onRetry={refetch}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Component content */}
    </div>
  );
};

// Export component with display name for debugging
EventEngagementDashboard.displayName = 'EventEngagementDashboard';
```

**Hook Patterns**:
```tsx
// Custom hooks with proper error handling and cleanup
export const useEventAnalytics = (clubId: number, timeRange: number) => {
  const [data, setData] = useState<EventAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!clubId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await eventAnalyticsService.getAnalytics(clubId, timeRange);
      setData(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Failed to fetch event analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      // Clear timeouts
      // Cleanup subscriptions
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
```

### Testing Requirements

#### Unit Tests
```csharp
[TestFixture]
public class EventEngagementServiceTests {
    private Mock<GatherGroveDbContext> _mockContext;
    private Mock<IMemberEngagementService> _mockMemberService;
    private Mock<ILogger<EventEngagementService>> _mockLogger;
    private EventEngagementService _service;

    [SetUp]
    public void SetUp() {
        _mockContext = new Mock<GatherGroveDbContext>();
        _mockMemberService = new Mock<IMemberEngagementService>();
        _mockLogger = new Mock<ILogger<EventEngagementService>>();
        _service = new EventEngagementService(
            _mockContext.Object,
            _mockMemberService.Object,
            _mockLogger.Object
        );
    }

    [Test]
    public async Task CalculateEventEngagementScoreAsync_ValidEventId_ReturnsMetrics() {
        // Arrange
        var eventId = 1;
        var expectedMetrics = new EventEngagementMetrics {
            EventId = eventId,
            EngagementScore = 75.0m
        };

        SetupMockData(eventId, expectedMetrics);

        // Act
        var result = await _service.CalculateEventEngagementScoreAsync(eventId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.EngagementScore, Is.EqualTo(75.0m));
    }

    [Test]
    public void CalculateEventEngagementScoreAsync_InvalidEventId_ThrowsArgumentException() {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.CalculateEventEngagementScoreAsync(-1)
        );
    }
}
```

#### Integration Tests
```csharp
[TestFixture]
public class EventEngagementIntegrationTests {
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private GatherGroveDbContext _context;

    [OneTimeSetUp]
    public void OneTimeSetUp() {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => {
                builder.ConfigureServices(services => {
                    // Replace services with test implementations
                    services.RemoveAll<GatherGroveDbContext>();
                    services.AddDbContext<GatherGroveDbContext>(options => {
                        options.UseInMemoryDatabase("TestDb");
                    });
                });
            });
        _client = _factory.CreateClient();
    }

    [SetUp]
    public async Task SetUp() {
        _context = _factory.Services.GetRequiredService<GatherGroveDbContext>();
        await SeedTestData();
    }

    [Test]
    public async Task GetEventEngagementScore_ValidEvent_ReturnsMetrics() {
        // Arrange
        var eventId = 1;
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/api/v1/events/engagement/events/{eventId}/engagement");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        
        var content = await response.Content.ReadAsStringAsync();
        var metrics = JsonSerializer.Deserialize<EventEngagementMetrics>(content);
        
        Assert.That(metrics.EventId, Is.EqualTo(eventId));
        Assert.That(metrics.EngagementScore, Is.GreaterThan(0));
    }
}
```

#### Frontend Tests
```tsx
// Component tests with React Testing Library
describe('EventEngagementDashboard', () => {
  const mockProps = {
    clubId: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<EventEngagementDashboard {...mockProps} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should display metrics when data loads successfully', async () => {
    const mockData = {
      metrics: {
        totalEvents: 10,
        averageAttendanceRate: 85.5,
        eventSatisfactionScore: 4.2,
        repeatAttendanceRate: 67.8
      }
    };

    jest.mocked(eventAnalyticsService.getAnalytics).mockResolvedValue(mockData);

    render(<EventEngagementDashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total events
      expect(screen.getByText('85.5%')).toBeInTheDocument(); // Attendance rate
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Satisfaction score
      expect(screen.getByText('67.8%')).toBeInTheDocument(); // Repeat attendance
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Failed to load analytics';
    jest.mocked(eventAnalyticsService.getAnalytics).mockRejectedValue(new Error(errorMessage));

    render(<EventEngagementDashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const mockData = { metrics: { totalEvents: 5 } };
    const getSpy = jest.mocked(eventAnalyticsService.getAnalytics).mockResolvedValue(mockData);

    render(<EventEngagementDashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });
});

// Hook tests
describe('useEventAnalytics', () => {
  it('should fetch data on mount', async () => {
    const mockData = { metrics: { totalEvents: 10 } };
    jest.mocked(eventAnalyticsService.getAnalytics).mockResolvedValue(mockData);

    const { result } = renderHook(() => useEventAnalytics(1, 90));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });
});
```

### Security Guidelines

#### Input Validation
```csharp
// Use data annotations for validation
public class RecordAttendanceRequest {
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Event ID must be positive")]
    public int EventId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Member ID must be positive")]
    public int MemberId { get; set; }

    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }

    public DateTime? AttendedAt { get; set; }
}

// Validate in controller
[HttpPost("attendance")]
public async Task<IActionResult> RecordAttendance([FromBody] RecordAttendanceRequest request) {
    if (!ModelState.IsValid) {
        return BadRequest(ModelState);
    }

    // Additional business logic validation
    var canRecord = await _authService.CanRecordAttendance(
        User.GetUserId(), 
        request.EventId, 
        request.MemberId
    );
    
    if (!canRecord) {
        return Forbid();
    }

    // Process request
    var result = await _service.RecordEventAttendanceAsync(
        request.EventId, 
        request.MemberId, 
        request.AttendedAt, 
        request.Notes
    );

    return Ok(result);
}
```

#### Authorization Patterns
```csharp
// Role-based authorization
[Authorize(Roles = "Admin,Moderator,EventOrganizer")]
[HttpGet("clubs/{clubId}/trends")]
public async Task<IActionResult> GetEventTrends(int clubId) {
    // Implementation
}

// Resource-based authorization
public class EventEngagementAuthorizationHandler 
    : AuthorizationHandler<ClubAccessRequirement, int> {
    
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ClubAccessRequirement requirement,
        int clubId) {
        
        var userId = context.User.GetUserId();
        var hasAccess = await _service.CanAccessClubAnalytics(userId, clubId);
        
        if (hasAccess) {
            context.Succeed(requirement);
        }
    }
}
```

#### Data Protection
```csharp
// Encrypt sensitive data
public class EncryptedMemberEngagement {
    public int Id { get; set; }
    public int MemberId { get; set; }
    
    [Personal] // Custom attribute for PII
    public string EncryptedNotes { get; set; }
    
    [NotMapped]
    public string Notes {
        get => _encryptionService.Decrypt(EncryptedNotes);
        set => EncryptedNotes = _encryptionService.Encrypt(value);
    }
}

// Implement GDPR compliance
public class DataPrivacyService {
    public async Task ExportMemberData(int memberId) {
        var data = await _context.MemberEngagementHistory
            .Where(h => h.MemberId == memberId)
            .Select(h => new {
                h.RecordedAt,
                h.OverallScore,
                h.ActivityType
                // Exclude sensitive fields
            })
            .ToListAsync();
            
        return data;
    }
    
    public async Task DeleteMemberData(int memberId) {
        var historyRecords = await _context.MemberEngagementHistory
            .Where(h => h.MemberId == memberId)
            .ToListAsync();
            
        // Anonymize instead of delete for analytics integrity
        foreach (var record in historyRecords) {
            record.MemberId = 0; // Anonymous
            record.ActivityMetadata = "{}"; // Clear metadata
        }
        
        await _context.SaveChangesAsync();
    }
}
```

This comprehensive documentation provides developers and administrators with everything needed to understand, implement, maintain, and troubleshoot the Event Engagement Analysis feature. The documentation follows best practices for technical documentation with clear examples, proper code formatting, and actionable guidance for both development and operational scenarios.