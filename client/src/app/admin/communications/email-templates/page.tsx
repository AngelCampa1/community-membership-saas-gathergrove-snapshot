"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Mail,
  Edit,
  Copy,
  Trash,
  MoreVertical,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { EmailTemplateResponse } from "@/services/emailTemplateService";
import { logger } from "@/lib/logger";

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [templates, setTemplates] = useState<EmailTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.clubId) return;

    // Check tier access
    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    loadTemplates();
  }, [user?.clubId, hasUnlimitedTier, router]);

  const loadTemplates = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    try {
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      const data = await emailTemplateService.getTemplates(user.clubId);
      setTemplates(data);
    } catch (error) {
      logger.error('communications', 'Error loading email templates', { error, clubId: user.clubId });
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    router.push("/admin/communications/templates/designer");
  };

  const handleEditTemplate = (templateId: number) => {
    router.push(`/admin/communications/templates/${templateId}/edit`);
  };

  const handleDuplicateTemplate = async (templateId: number) => {
    if (!user?.clubId) return;

    try {
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      await emailTemplateService.duplicateTemplate(user.clubId, templateId);
      
      toast.success("Template has been duplicated successfully");

      loadTemplates();
    } catch (error) {
      logger.error('communications', 'Error duplicating email template', { error, templateId, clubId: user.clubId });
      toast.error("Failed to duplicate template");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!user?.clubId || !templateToDelete) return;

    setDeleting(true);
    try {
      const { emailTemplateService } = await import('@/services/emailTemplateService');
      await emailTemplateService.deleteTemplate(user.clubId, templateToDelete);
      
      toast.success("Template has been deleted successfully");
      
      setTemplates(templates.filter(t => t.id !== templateToDelete));
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      logger.error('communications', 'Error deleting email template', { error, templateId: templateToDelete, clubId: user.clubId });
      toast.error("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (templateId: number) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
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
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email templates with personalization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Expand Feature</Badge>
          <Button onClick={handleCreateTemplate} data-testid="button-create-template">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      ) : templates.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first email template to start sending personalized communications to your members
            </p>
            <Button onClick={handleCreateTemplate} data-testid="button-create-first-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {template.templateName}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-template-menu-${template.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditTemplate(template.id)}
                        data-testid={`menu-edit-${template.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateTemplate(template.id)}
                        data-testid={`menu-duplicate-${template.id}`}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(template.id)}
                        className="text-destructive"
                        data-testid={`menu-delete-${template.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(template.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template.id)}
                    className="flex-1"
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
