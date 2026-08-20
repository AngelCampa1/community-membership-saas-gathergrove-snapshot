"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  TrendingUp,
  MousePointer,
  Eye,
  XCircle,
  CheckCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { CommunicationAnalyticsResponse } from "@/services/communicationAnalyticsService";
import { logger } from "@/lib/logger";
import { EmailTemplateResponse } from "@/services/emailTemplateService";

export default function CommunicationAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [analytics, setAnalytics] = useState<CommunicationAnalyticsResponse | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<string>("30");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [communicationType, setCommunicationType] = useState<string>("all");

  useEffect(() => {
    if (!user?.clubId) return;

    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    loadData();
  }, [user?.clubId, hasUnlimitedTier, router, dateRange, selectedTemplate, communicationType]);

  const loadData = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    // Calculate date range and build filters outside try block for error logging
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    const filters: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    if (selectedTemplate !== "all") {
      filters.templateId = parseInt(selectedTemplate);
    }

    if (communicationType !== "all") {
      filters.communicationType = communicationType;
    }

    try {
      const { communicationAnalyticsService } = await import('@/services/communicationAnalyticsService');
      const { emailTemplateService } = await import('@/services/emailTemplateService');

      const [analyticsData, templatesData] = await Promise.all([
        communicationAnalyticsService.getAnalyticsSummary(user.clubId, filters),
        emailTemplateService.getTemplates(user.clubId),
      ]);

      setAnalytics(analyticsData);
      setTemplates(templatesData);
    } catch (error) {
      logger.error('communications', 'Error loading communication analytics', { error, clubId: user.clubId, filters });
      toast.error("Failed to load communication analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Communication Analytics</h1>
          <p className="text-muted-foreground">
            Track performance metrics for your email campaigns
          </p>
        </div>
        <Badge variant="secondary">Expand Feature</Badge>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="card-filters">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={communicationType} onValueChange={setCommunicationType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse" data-testid={`card-loading-${i}`}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !analytics || analytics.totalSent === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data available</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              No communications have been sent in the selected time period. Send your first
              campaign to see analytics here.
            </p>
            <Button onClick={() => router.push("/admin/communications/new")} data-testid="button-create-campaign">
              <Mail className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card data-testid="card-metric-sent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Total Sent</CardDescription>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totalSent)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(analytics.totalDelivered)} delivered
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-open-rate">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Open Rate</CardDescription>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatPercentage(analytics.openRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(analytics.totalOpened)} opens
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-click-rate">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Click Rate</CardDescription>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatPercentage(analytics.clickRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(analytics.totalClicked)} clicks
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-delivery-rate">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Delivery Rate</CardDescription>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics.deliveryRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(analytics.totalBounced)} bounced
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card data-testid="card-detailed-metrics">
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>
                Comprehensive performance breakdown for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Sent</span>
                    <span className="font-medium">{formatNumber(analytics.totalSent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <span className="font-medium">{formatNumber(analytics.totalDelivered)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Rate</span>
                    <span className="font-medium text-success">
                      {formatPercentage(analytics.deliveryRate)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opened</span>
                    <span className="font-medium">{formatNumber(analytics.totalOpened)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open Rate</span>
                    <span className="font-medium text-success">
                      {formatPercentage(analytics.openRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clicked</span>
                    <span className="font-medium">{formatNumber(analytics.totalClicked)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Click Rate</span>
                    <span className="font-medium text-primary">
                      {formatPercentage(analytics.clickRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounced</span>
                    <span className="font-medium text-destructive">
                      {formatNumber(analytics.totalBounced)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unsubscribed</span>
                    <span className="font-medium text-destructive">
                      {formatNumber(analytics.totalUnsubscribed)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="mt-6" data-testid="card-insights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.openRate >= 25 && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Great open rate!</p>
                      <p className="text-sm text-muted-foreground">
                        Your open rate of {formatPercentage(analytics.openRate)} exceeds the industry average of 25%.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.clickRate >= 5 && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Excellent engagement!</p>
                      <p className="text-sm text-muted-foreground">
                        Your click rate of {formatPercentage(analytics.clickRate)} shows strong member engagement.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.deliveryRate >= 95 && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">High deliverability!</p>
                      <p className="text-sm text-muted-foreground">
                        Your delivery rate of {formatPercentage(analytics.deliveryRate)} indicates healthy email practices.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.openRate < 15 && (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Low open rate</p>
                      <p className="text-sm text-muted-foreground">
                        Consider testing different subject lines or sending times to improve engagement.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.bounceRate > 5 && (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">High bounce rate</p>
                      <p className="text-sm text-muted-foreground">
                        Review your member email addresses and consider list cleaning.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
