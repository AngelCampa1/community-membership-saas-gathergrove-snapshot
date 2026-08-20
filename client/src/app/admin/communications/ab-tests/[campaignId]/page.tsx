"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Trophy,
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/useToast";
import { ABTestCampaignResponse, ABTestResultsResponse } from "@/services/abTestingService";
import Link from "next/link";

export default function ABTestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();
  const [campaign, setCampaign] = useState<ABTestCampaignResponse | null>(null);
  const [results, setResults] = useState<ABTestResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [determining, setDetermining] = useState(false);

  // Parse campaignId after hooks are initialized
  const campaignId = params?.campaignId ? parseInt(params.campaignId as string) : NaN;

  useEffect(() => {
    if (!user?.clubId) return;

    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    if (isNaN(campaignId)) {
      router.push("/admin/communications/ab-tests");
      return;
    }

    loadData();
  }, [user?.clubId, hasUnlimitedTier, router, campaignId]);

  const loadData = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    try {
      const { abTestingService } = await import('@/services/abTestingService');

      const [campaignData, resultsData] = await Promise.all([
        abTestingService.getCampaign(user.clubId, campaignId),
        abTestingService.getCampaignResults(user.clubId, campaignId),
      ]);

      setCampaign(campaignData);
      setResults(resultsData);
    } catch (error) {
      logger.error('communications', 'Error loading A/B test campaign details', { error, clubId: user.clubId, campaignId });
      toast.error("Failed to load A/B test campaign details");
      router.push("/admin/communications/ab-tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDetermineWinner = async () => {
    if (!user?.clubId) return;

    setDetermining(true);
    try {
      const { abTestingService } = await import('@/services/abTestingService');
      await abTestingService.determineWinner(user.clubId, campaignId);

      toast.success("The winning variant has been selected based on performance");

      setWinnerDialogOpen(false);
      loadData();
    } catch (error) {
      logger.error('communications', 'Error determining A/B test winner', { error, clubId: user.clubId, campaignId });
      toast.error("Failed to determine winning variant");
    } finally {
      setDetermining(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWinnerVariant = () => {
    if (!results || !campaign) return null;
    if (!campaign.winnerId) return null;
    return campaign.winnerId === campaign.variantATemplateId ? 'A' : 'B';
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  // Handle invalid campaign ID - after all hooks
  if (isNaN(campaignId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Invalid campaign ID</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign || !results) {
    return null;
  }

  const winnerVariant = getWinnerVariant();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/communications/ab-tests">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{campaign.campaignName}</h1>
            <p className="text-muted-foreground">
              A/B test results and performance comparison
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results.isComplete ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary">In Progress</Badge>
          )}
        </div>
      </div>

      {/* Winner Announcement */}
      {winnerVariant && (
        <Card className="mb-6 border-success/50 bg-success/10" data-testid="card-winner">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Winner: Variant {winnerVariant}</h3>
                <p className="text-sm text-muted-foreground">
                  This variant performed better based on {winnerVariant === 'A' ? 'Variant A' : 'Variant B'} metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Configuration */}
      <Card className="mb-6" data-testid="card-configuration">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Test Percentage</p>
              <p className="text-lg font-semibold">{campaign.testPercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-lg font-semibold">{formatDate(campaign.createdAt)}</p>
            </div>
            {campaign.endedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Ended</p>
                <p className="text-lg font-semibold">{formatDate(campaign.endedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variant Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Variant A */}
        <Card
          className={winnerVariant === 'A' ? 'border-success' : ''}
          data-testid="card-variant-a"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Variant A
              </CardTitle>
              {winnerVariant === 'A' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Winner
                </Badge>
              )}
            </div>
            <CardDescription>Template ID: {campaign.variantATemplateId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Sent</span>
                  <span className="font-semibold">{formatNumber(results.variantA.totalSent)}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Open Rate
                  </span>
                  <span className="font-semibold text-success">
                    {formatPercentage(results.variantA.openRate)}
                  </span>
                </div>
                <Progress value={results.variantA.openRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(results.variantA.totalOpened)} opens
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    Click Rate
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPercentage(results.variantA.clickRate)}
                  </span>
                </div>
                <Progress value={results.variantA.clickRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(results.variantA.totalClicked)} clicks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variant B */}
        <Card
          className={winnerVariant === 'B' ? 'border-success' : ''}
          data-testid="card-variant-b"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Variant B
              </CardTitle>
              {winnerVariant === 'B' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Winner
                </Badge>
              )}
            </div>
            <CardDescription>Template ID: {campaign.variantBTemplateId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Sent</span>
                  <span className="font-semibold">{formatNumber(results.variantB.totalSent)}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Open Rate
                  </span>
                  <span className="font-semibold text-success">
                    {formatPercentage(results.variantB.openRate)}
                  </span>
                </div>
                <Progress value={results.variantB.openRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(results.variantB.totalOpened)} opens
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    Click Rate
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPercentage(results.variantB.clickRate)}
                  </span>
                </div>
                <Progress value={results.variantB.clickRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(results.variantB.totalClicked)} clicks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Analysis */}
      {!results.isComplete && (
        <Card className="mb-6" data-testid="card-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {results.hasReachedMinimumSample ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className="text-sm">
                  {results.hasReachedMinimumSample
                    ? "Minimum sample size reached"
                    : "Waiting for minimum sample size"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {results.isStatisticallySignificant ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className="text-sm">
                  {results.isStatisticallySignificant
                    ? `Statistically significant (${formatPercentage(results.statisticalSignificance || 0)})`
                    : "Not yet statistically significant"}
                </span>
              </div>

              {results.hasReachedMinimumSample && (
                <Button
                  onClick={() => setWinnerDialogOpen(true)}
                  className="w-full"
                  data-testid="button-determine-winner"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Determine Winner
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Determine Winner Dialog */}
      <AlertDialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <AlertDialogContent data-testid="dialog-determine-winner">
          <AlertDialogHeader>
            <AlertDialogTitle>Determine Winner</AlertDialogTitle>
            <AlertDialogDescription>
              This will analyze the performance of both variants and automatically select the winner
              based on open rates. This action will end the A/B test.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={determining} data-testid="button-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDetermineWinner}
              disabled={determining}
              data-testid="button-confirm"
            >
              {determining ? "Determining..." : "Determine Winner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
