"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FlaskConical, Eye, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { ABTestCampaignResponse } from "@/services/abTestingService";
import { EmailTemplateResponse } from "@/services/emailTemplateService";
import { logger } from "@/lib/logger";

export default function ABTestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<ABTestCampaignResponse[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [variantATemplateId, setVariantATemplateId] = useState<string>("");
  const [variantBTemplateId, setVariantBTemplateId] = useState<string>("");
  const [testPercentage, setTestPercentage] = useState("50");

  useEffect(() => {
    if (!user?.clubId) return;

    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    loadData();
  }, [user?.clubId, hasUnlimitedTier, router]);

  const loadData = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    try {
      const { abTestingService } = await import('@/services/abTestingService');
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      
      const [campaignsData, templatesData] = await Promise.all([
        abTestingService.getCampaigns(user.clubId),
        emailTemplateService.getTemplates(user.clubId),
      ]);

      setCampaigns(campaignsData);
      setTemplates(templatesData);
    } catch (error) {
      logger.error('communications', 'Error loading A/B test campaigns and templates', { error, clubId: user.clubId });
      toast.error("Failed to load A/B test campaigns");
    } finally{
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a name for your campaign");
      return;
    }

    if (!variantATemplateId || !variantBTemplateId) {
      toast.error("Please select both variant templates");
      return;
    }

    if (!user?.clubId) return;

    setCreating(true);
    try {
      const { abTestingService } = await import('@/services/abTestingService');
      
      await abTestingService.createCampaign(user.clubId, {
        campaignName,
        variantATemplateId: parseInt(variantATemplateId),
        variantBTemplateId: parseInt(variantBTemplateId),
        testPercentage: parseInt(testPercentage),
      });

      toast.success("A/B test campaign has been created successfully");

      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      logger.error('communications', 'Error creating A/B test campaign', { error, clubId: user?.clubId, campaignName, variantATemplateId, variantBTemplateId });
      toast.error("Failed to create A/B test campaign");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setVariantATemplateId("");
    setVariantBTemplateId("");
    setTestPercentage("50");
  };

  const handleViewResults = (campaignId: number) => {
    router.push(`/admin/communications/ab-tests/${campaignId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">A/B Test Campaigns</h1>
          <p className="text-muted-foreground">
            Test different email templates to optimize engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Expand Feature</Badge>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-campaign"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse" data-testid={`card-loading-${i}`}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first A/B test campaign to compare email templates and improve engagement
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              data-testid="button-create-first-campaign"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      {campaign.campaignName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {campaign.testPercentage}% test split
                    </CardDescription>
                  </div>
                  {campaign.winnerId && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Winner Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(campaign.createdAt)}</span>
                  </div>
                  {campaign.endedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ended</span>
                      <span>{formatDate(campaign.endedAt)}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(campaign.id)}
                      className="flex-1"
                      data-testid={`button-view-results-${campaign.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-campaign">
          <DialogHeader>
            <DialogTitle>Create A/B Test Campaign</DialogTitle>
            <DialogDescription>
              Compare two email templates to see which performs better
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                data-testid="input-campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Weekly Newsletter Test"
              />
            </div>
            <div>
              <Label htmlFor="variant-a">Variant A Template *</Label>
              <Select value={variantATemplateId} onValueChange={setVariantATemplateId}>
                <SelectTrigger id="variant-a" data-testid="select-variant-a">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-b">Variant B Template *</Label>
              <Select value={variantBTemplateId} onValueChange={setVariantBTemplateId}>
                <SelectTrigger id="variant-b" data-testid="select-variant-b">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="test-percentage">Test Percentage</Label>
              <Input
                id="test-percentage"
                data-testid="input-test-percentage"
                type="number"
                min="10"
                max="100"
                value={testPercentage}
                onChange={(e) => setTestPercentage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of audience to include in test (50 = 50/50 split)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={creating}
              data-testid="button-create"
            >
              {creating ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
