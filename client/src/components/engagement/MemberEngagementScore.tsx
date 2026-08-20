'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Info,
  MessageCircle,
  Calendar,
  Activity,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  memberEngagementService,
  type MemberEngagementScoreResponse,
} from '@/services/memberEngagementService';

interface TrendIconResult {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ScoreBadge {
  label: string;
  className: string;
}

interface MemberEngagementScoreProps {
  memberId: string | null;
  /**
   * Optional precomputed overall score (0-100). When supplied, compact mode
   * renders directly from it without issuing a per-row API request. Callers
   * that already hold bulk engagement data (e.g. the members table) should
   * pass this to avoid N+1 fetches.
   */
  score?: number;
  showDetailed?: boolean;
  isCompact?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

const getScoreBadge = (score: number): ScoreBadge => {
  if (score >= 90) return { label: 'Champion', className: 'bg-secondary/10 text-secondary' };
  if (score >= 80) return { label: 'Highly Active', className: 'bg-success/10 text-success' };
  if (score >= 70) return { label: 'Active', className: 'bg-primary/10 text-primary' };
  if (score >= 60) return { label: 'Moderate', className: 'bg-warning/10 text-warning' };
  if (score >= 40) return { label: 'Low Activity', className: 'bg-warning/10 text-warning' };
  return { label: 'At Risk', className: 'bg-destructive/10 text-destructive' };
};

const getTrendIcon = (trend: string): TrendIconResult => {
  if (trend === 'up') return { icon: TrendingUp, color: 'text-success' };
  if (trend === 'down') return { icon: TrendingDown, color: 'text-destructive' };
  return { icon: Minus, color: 'text-muted-foreground' };
};

const formatCategoryName = (category: string): string =>
  category
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

const MemberEngagementScore: React.FC<MemberEngagementScoreProps> = ({
  memberId,
  score,
  showDetailed = true,
  isCompact = false,
}) => {
  const [data, setData] = useState<MemberEngagementScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // When a precomputed score is supplied for compact display we skip fetching.
  const hasInlineScore = isCompact && typeof score === 'number';

  useEffect(() => {
    if (hasInlineScore) {
      return;
    }

    const trimmedId = memberId?.trim();
    if (!trimmedId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const result = await memberEngagementService.getMemberEngagementScore(trimmedId);
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('engagement', 'Failed to fetch member engagement data', { error, memberId });
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId, hasInlineScore]);

  // Compact rendering driven by a precomputed bulk score — no fetch, no spinner.
  if (hasInlineScore) {
    const badge = getScoreBadge(score as number);
    return (
      <div className="flex items-center space-x-2">
        <span className={cn('text-sm font-medium', getScoreColor(score as number))}>
          {(score as number).toFixed(1)}%
        </span>
        <Badge className={`${badge.className} text-xs`}>{badge.label}</Badge>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse" data-testid="engagement-score-loading">
        <div className="flex items-center space-x-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 bg-muted rounded w-20"></div>
      </div>
    );
  }

  if (!data) {
    if (isCompact) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">Member engagement data not available</p>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(data.overallScore);
  const trend = getTrendIcon(data.trend);
  const TrendIcon = trend.icon;
  const trendPercentage =
    typeof data.trendPercentage === 'number' ? Math.abs(data.trendPercentage) : null;

  // Compact view for table display (fetched).
  if (isCompact) {
    return (
      <div className="flex items-center space-x-2">
        <span className={cn('text-sm font-medium', getScoreColor(data.overallScore))}>
          {data.overallScore.toFixed(1)}%
        </span>
        <Badge className={`${scoreBadge.className} text-xs`}>{scoreBadge.label}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{data.memberName || `Member ${data.memberId}`}</h3>
          {data.memberEmail && (
            <p className="text-sm text-muted-foreground">{data.memberEmail}</p>
          )}
          {data.calculatedAt && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(data.calculatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
      </div>

      {/* Overall Score Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Engagement Score</h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn('text-3xl font-bold', getScoreColor(data.overallScore))}>
                  {data.overallScore.toFixed(1)}%
                </span>
                <div className={cn('flex items-center text-sm', trend.color)}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  {trendPercentage !== null ? `${trendPercentage.toFixed(1)}%` : data.trend}
                </div>
              </div>
            </div>
            <Award className={cn('h-8 w-8', getScoreColor(data.overallScore))} />
          </div>

          <div className="space-y-2">
            <Progress value={data.overallScore} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetailed && (
        <>
          {/* Score Breakdown (real backend category scores) */}
          {data.categoryScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Score Breakdown
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.categoryScores.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{formatCategoryName(cat.category)}</span>
                      <span className={cn('text-sm font-semibold', getScoreColor(cat.score))}>
                        {cat.score.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Weight: {Math.round(cat.weight * 100)}%
                    </p>
                    <div className="space-y-1">
                      <Progress value={cat.score} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Contributes {cat.contribution.toFixed(1)} points to overall score</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity summary (real counts) */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{data.messagesCount}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{data.eventsAttended}</p>
                    <p className="text-xs text-muted-foreground">Events attended</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{data.activeDays}</p>
                    <p className="text-xs text-muted-foreground">Active days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{data.uniqueFeatures}</p>
                    <p className="text-xs text-muted-foreground">Features used</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations (real backend guidance) */}
          {data.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.recommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-sm text-muted-foreground flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MemberEngagementScore;
