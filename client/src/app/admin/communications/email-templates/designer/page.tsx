"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { emailTemplateService } from "@/services/emailTemplateService";
import { SecurityUtils } from "@/utils/security";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface PersonalizationToken {
  tokenName: string;
  displayName: string;
  description?: string;
  category: string;
  exampleValue: string;
}

export default function EmailTemplateDesignerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #181a1f; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4a9a72; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #ffffff; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7d75; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4a9a72; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{club_name}}</h1>
    </div>
    <div class="content">
      <h2>Hello {{member_first_name}}!</h2>
      <p>Welcome to our latest newsletter.</p>
      <p><a href="#" class="button">Learn More</a></p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{club_name}}. All rights reserved.</p>
      <p><a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`);

  const [activeView, setActiveView] = useState<"code" | "preview">("code");
  const [saving, setSaving] = useState(false);
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
  }, [user?.clubId, hasUnlimitedTier, router]);

  const loadAvailableTokens = async () => {
    // For now, use static tokens until backend is fully integrated
    setAvailableTokens([
      { tokenName: "member_name", displayName: "Member Name", category: "Member", exampleValue: "John Doe" },
      { tokenName: "member_first_name", displayName: "First Name", category: "Member", exampleValue: "John" },
      { tokenName: "member_email", displayName: "Email", category: "Member", exampleValue: "john@example.com" },
      { tokenName: "club_name", displayName: "Club Name", category: "Club", exampleValue: "Awesome Club" },
      { tokenName: "membership_type", displayName: "Membership Type", category: "Member", exampleValue: "Premium" },
      { tokenName: "current_year", displayName: "Current Year", category: "System", exampleValue: "2025" },
      { tokenName: "current_date", displayName: "Current Date", category: "System", exampleValue: "October 13, 2025" },
    ]);
  };

  const insertToken = (tokenName: string) => {
    const token = `{{${tokenName}}}`;
    setHtmlContent(htmlContent + token);
    toast.success(`{{${tokenName}}} added to your template`);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a name for your template");
      return;
    }

    if (!user?.clubId) {
      toast.error("Club ID not found. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      await emailTemplateService.createTemplate(user.clubId, {
        templateName: templateName,
        description: description || undefined,
        templateHtml: htmlContent,
        templateJson: undefined
      });

      toast.success("Your email template has been saved successfully");

      // Navigate back to templates list
      router.push("/admin/communications/templates");
    } catch (error) {
      logger.error('communications', 'Error saving email template', { error, clubId: user?.clubId, templateName: name });
      const errorMessage = error instanceof Error ? error.message : "An error occurred while saving your template";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    // Replace tokens with example values for preview
    let previewHtml = htmlContent;
    availableTokens.forEach(token => {
      const regex = new RegExp(`{{${token.tokenName}}}`, 'g');
      previewHtml = previewHtml.replace(regex, token.exampleValue);
    });
    // Sanitize HTML to prevent XSS attacks - allow common email template tags
    return SecurityUtils.sanitizeHtml(previewHtml, [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'a', 'div', 'span',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
      'img', 'hr'
    ]);
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/communications/templates">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Email Template Designer</h1>
                <p className="text-sm text-muted-foreground">
                  Create professional email templates with personalization
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Area */}
          <div className="lg:col-span-2 space-y-4">
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
                  <CardTitle>Template Content</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={activeView === "code" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("code")}
                      data-testid="button-code-view"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </Button>
                    <Button
                      variant={activeView === "preview" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("preview")}
                      data-testid="button-preview"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeView === "code" ? (
                  <Textarea
                    data-testid="textarea-html-content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="font-mono text-sm min-h-[500px]"
                    placeholder="Enter your HTML template here..."
                  />
                ) : (
                  <div
                    className="border rounded-md p-4 min-h-[500px] bg-background"
                    // BUG-004 FIX: Use createSafeHTML for double-sanitization protection
                    dangerouslySetInnerHTML={SecurityUtils.createSafeHTML(renderPreview(), [
                      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
                      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                      'blockquote', 'code', 'pre', 'a', 'div', 'span',
                      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
                      'img', 'hr'
                    ])}
                    data-testid="preview-container"
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
                <CardTitle className="text-lg">Personalization Tokens</CardTitle>
                <CardDescription>
                  Click to insert dynamic content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableTokens.map((token) => (
                  <div key={token.tokenName} className="flex items-start gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => insertToken(token.tokenName)}
                      className="flex-1 justify-start text-left h-auto py-2"
                      data-testid={`button-token-${token.tokenName}`}
                    >
                      <div>
                        <div className="font-medium">{token.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {`{{${token.tokenName}}}`}
                        </div>
                      </div>
                    </Button>
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
                <p>• Use tokens like {`{{member_name}}`} for personalization</p>
                <p>• Keep email width around 600px for best compatibility</p>
                <p>• Test on multiple devices before sending</p>
                <p>• Include an unsubscribe link for compliance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
