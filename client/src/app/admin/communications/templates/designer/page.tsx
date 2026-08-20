"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Code,
  Layout,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { logger } from "@/lib/logger";

interface PersonalizationToken {
  tokenName: string;
  displayName: string;
  description?: string;
  category: string;
  exampleValue: string;
}

// Dynamically import GrapesJS to avoid SSR issues
const GrapesJSEditor = dynamic(() => import('@/components/GrapesJSEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center border rounded-md bg-muted">
      <p className="text-muted-foreground">Loading email designer...</p>
    </div>
  ),
});

function EmailTemplateDesignerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const templateId = searchParams?.get('templateId');
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [activeView, setActiveView] = useState<"designer" | "code">("designer");
  const [_previewDevice, _setPreviewDevice] = useState<"desktop" | "mobile">("desktop"); // For future device preview feature
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!templateId);
  const [availableTokens, setAvailableTokens] = useState<PersonalizationToken[]>([]);

  useEffect(() => {
    if (!user?.clubId) return;
    
    // Check tier access
    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    // Load available tokens
    loadAvailableTokens();

    // Load template if editing
    if (templateId) {
      loadTemplate();
    }
  }, [user?.clubId, hasUnlimitedTier, router, templateId]);

  const loadAvailableTokens = async () => {
    setAvailableTokens([
      { tokenName: "member_name", displayName: "Member Name", category: "Member", exampleValue: "John Doe" },
      { tokenName: "member_first_name", displayName: "First Name", category: "Member", exampleValue: "John" },
      { tokenName: "member_email", displayName: "Email", category: "Member", exampleValue: "john@example.com" },
      { tokenName: "club_name", displayName: "Club Name", category: "Club", exampleValue: "Awesome Club" },
      { tokenName: "membership_type", displayName: "Membership Type", category: "Member", exampleValue: "Premium" },
      { tokenName: "upcoming_events", displayName: "Upcoming Events", category: "Events", exampleValue: "Annual Gala, Book Club" },
      { tokenName: "engagement_score", displayName: "Engagement Score", category: "Member", exampleValue: "85" },
      { tokenName: "current_year", displayName: "Current Year", category: "System", exampleValue: "2025" },
      { tokenName: "current_date", displayName: "Current Date", category: "System", exampleValue: "October 13, 2025" },
    ]);
  };

  const loadTemplate = async () => {
    if (!user?.clubId || !templateId) return;

    try {
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      const template = await emailTemplateService.getTemplate(user.clubId, parseInt(templateId));
      
      setTemplateName(template.templateName);
      setDescription(template.description || "");
      setHtmlContent(template.templateHtml);
      setJsonContent(template.templateJson || "");
    } catch (error) {
      logger.error('communications', 'Error loading email template for editing', { error, clubId: user.clubId, templateId });
      toast.error("Failed to load template for editing");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a name for your template");
      return;
    }

    if (!user?.clubId) {
      toast.error("User club information not found");
      return;
    }

    setSaving(true);
    try {
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      
      if (templateId) {
        // Update existing template
        await emailTemplateService.updateTemplate(user.clubId, parseInt(templateId), {
          templateName,
          description: description || undefined,
          templateHtml: htmlContent,
          templateJson: jsonContent || undefined,
        });
        
        toast.success("Your email template has been updated successfully");
      } else {
        // Create new template
        await emailTemplateService.createTemplate(user.clubId, {
          templateName,
          description: description || undefined,
          templateHtml: htmlContent,
          templateJson: jsonContent || undefined,
        });
        
        toast.success("Your email template has been created successfully");
      }

      router.push("/admin/communications/email-templates");
    } catch (error) {
      logger.error('communications', 'Error saving email template', { error, clubId: user.clubId, templateName, templateId });
      toast.error("An error occurred while saving your template");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (html: string, json: string) => {
    setHtmlContent(html);
    setJsonContent(json);
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/communications/email-templates">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">
                  {templateId ? "Edit Email Template" : "Create Email Template"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Design professional email templates with drag-and-drop
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Expand Feature</Badge>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                data-testid="button-save-template"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Template Info */}
            <Card data-testid="card-template-info">
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    data-testid="input-template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Monthly Newsletter"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    data-testid="input-template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this template"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card data-testid="card-template-editor">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Designer</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={activeView === "designer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("designer")}
                      data-testid="button-designer-view"
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Designer
                    </Button>
                    <Button
                      variant={activeView === "code" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("code")}
                      data-testid="button-code-view"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      HTML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeView === "designer" ? (
                  <div className="border rounded-md overflow-hidden" data-testid="grapesjs-editor">
                    <GrapesJSEditor
                      initialHtml={htmlContent}
                      initialJson={jsonContent}
                      onChange={handleEditorChange}
                    />
                  </div>
                ) : (
                  <Textarea
                    data-testid="textarea-html-content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="font-mono text-sm min-h-[600px]"
                    placeholder="HTML content will appear here..."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Personalization Tokens */}
            <Card data-testid="card-personalization-tokens">
              <CardHeader>
                <CardTitle className="text-lg">Personalization</CardTitle>
                <CardDescription>
                  Use these tokens in your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableTokens.map((token) => (
                  <div key={token.tokenName} className="p-2 rounded border bg-muted/50">
                    <div className="font-medium text-sm">{token.displayName}</div>
                    <code className="text-xs text-muted-foreground">
                      {`{{${token.tokenName}}}`}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Drag blocks from the left panel to build your email</p>
                <p>• Use tokens like {`{{member_name}}`} for personalization</p>
                <p>• Preview on mobile and desktop before saving</p>
                <p>• Keep email width around 600px for best compatibility</p>
                <p>• Always include an unsubscribe link</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading template designer...</div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function EmailTemplateDesignerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailTemplateDesignerPageContent />
    </Suspense>
  );
}
