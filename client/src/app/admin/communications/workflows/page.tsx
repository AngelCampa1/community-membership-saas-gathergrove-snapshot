"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Workflow,
  Play,
  Pause,
  Edit,
  Trash,
  MoreVertical,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { WorkflowResponse } from "@/services/communicationWorkflowService";
import { logger } from "@/lib/logger";

export default function CommunicationWorkflowsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("member_join");

  useEffect(() => {
    if (!user?.clubId) return;

    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    loadWorkflows();
  }, [user?.clubId, hasUnlimitedTier, router]);

  const loadWorkflows = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    try {
      const { communicationWorkflowService } = await import('@/services/communicationWorkflowService');
      const data = await communicationWorkflowService.getWorkflows(user.clubId, true);
      setWorkflows(data);
    } catch (error) {
      logger.error('communications', 'Error loading communication workflows', { error, clubId: user.clubId });
      toast.error("Failed to load communication workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a name for your workflow");
      return;
    }

    if (!user?.clubId) return;

    setCreating(true);
    try {
      const { communicationWorkflowService } = await import('@/services/communicationWorkflowService');

      // Create basic workflow steps
      const defaultSteps = JSON.stringify([
        {
          id: "1",
          type: "trigger",
          config: { triggerType }
        },
        {
          id: "2",
          type: "action",
          config: { actionType: "send_email" }
        }
      ]);

      await communicationWorkflowService.createWorkflow(user.clubId, {
        workflowName,
        description: description || undefined,
        triggerType,
        workflowSteps: defaultSteps,
      });

      toast.success("Your communication workflow has been created successfully");

      setCreateDialogOpen(false);
      resetForm();
      loadWorkflows();
    } catch (error) {
      logger.error('communications', 'Error creating communication workflow', { error, clubId: user.clubId, workflowName, triggerType });
      toast.error("Failed to create communication workflow");
    } finally{
      setCreating(false);
    }
  };

  const resetForm = () => {
    setWorkflowName("");
    setDescription("");
    setTriggerType("member_join");
  };

  const handleToggleWorkflow = async (workflowId: number, currentStatus: boolean) => {
    if (!user?.clubId) return;

    try {
      const { communicationWorkflowService } = await import('@/services/communicationWorkflowService');
      await communicationWorkflowService.toggleWorkflow(user.clubId, workflowId, !currentStatus);

      const message = currentStatus 
        ? "Workflow has been paused and will not execute"
        : "Workflow is now active and will execute on triggers";
      toast.success(message);

      loadWorkflows();
    } catch (error) {
      logger.error('communications', 'Error toggling workflow status', { error, clubId: user.clubId, workflowId, newStatus: !currentStatus });
      toast.error("Failed to update workflow status");
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!user?.clubId || !workflowToDelete) return;

    setDeleting(true);
    try {
      const { communicationWorkflowService } = await import('@/services/communicationWorkflowService');
      await communicationWorkflowService.deleteWorkflow(user.clubId, workflowToDelete);

      toast.success("Workflow has been deleted successfully");

      setWorkflows(workflows.filter(w => w.id !== workflowToDelete));
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      logger.error('communications', 'Error deleting workflow', { error, clubId: user.clubId, workflowId: workflowToDelete });
      toast.error("Failed to delete workflow");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (workflowId: number) => {
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'member_join': 'Member Joins',
      'event_rsvp': 'Event RSVP',
      'inactivity': 'Member Inactivity',
      'custom_date': 'Custom Date',
      'dues_reminder': 'Dues Reminder',
    };
    return labels[trigger] || trigger;
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Communication Workflows</h1>
          <p className="text-muted-foreground">
            Automate member communications with triggered workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Expand Feature</Badge>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-workflow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Workflows Grid */}
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
      ) : workflows.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first workflow to automate communications based on member actions and events
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              data-testid="button-create-first-workflow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      {workflow.workflowName}
                    </CardTitle>
                    {workflow.description && (
                      <CardDescription className="mt-1">
                        {workflow.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-workflow-menu-${workflow.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/communications/workflows/${workflow.id}`)}
                        data-testid={`menu-edit-${workflow.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.isActive)}
                        data-testid={`menu-toggle-${workflow.id}`}
                      >
                        {workflow.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(workflow.id)}
                        className="text-destructive"
                        data-testid={`menu-delete-${workflow.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Paused
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {getTriggerLabel(workflow.triggerType)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {formatDate(workflow.createdAt)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/communications/workflows/${workflow.id}`)}
                    className="w-full"
                    data-testid={`button-view-${workflow.id}`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-workflow">
          <DialogHeader>
            <DialogTitle>Create Communication Workflow</DialogTitle>
            <DialogDescription>
              Set up automated communications triggered by member actions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="workflow-name">Workflow Name *</Label>
              <Input
                id="workflow-name"
                data-testid="input-workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Welcome Email Sequence"
              />
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                data-testid="input-workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workflow"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="trigger-type">Trigger Type *</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger id="trigger-type" data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_join">Member Joins</SelectItem>
                  <SelectItem value="event_rsvp">Event RSVP</SelectItem>
                  <SelectItem value="inactivity">Member Inactivity</SelectItem>
                  <SelectItem value="custom_date">Custom Date</SelectItem>
                  <SelectItem value="dues_reminder">Dues Reminder</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                When should this workflow be triggered?
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
              onClick={handleCreateWorkflow}
              disabled={creating}
              data-testid="button-create"
            >
              {creating ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-workflow">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone and will stop all automated communications.
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
              onClick={handleDeleteWorkflow}
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

