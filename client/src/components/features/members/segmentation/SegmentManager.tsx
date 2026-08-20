"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, AlertCircle, Users, Eye } from "lucide-react";
import memberSegmentationService, {
  type MemberSegment,
  type SegmentFilterCriteria,
  type CreateSegmentRequest,
  type UpdateSegmentRequest,
} from "@/services/memberSegmentationService";
import { logger } from "@/lib/logger";

const ANY = "any";

type StatusValue = NonNullable<SegmentFilterCriteria["status"]>;
type DuesValue = NonNullable<SegmentFilterCriteria["duesStatus"]>;
type EngagementValue = NonNullable<SegmentFilterCriteria["engagementLevel"]>;

interface FormState {
  name: string;
  description: string;
  isActive: boolean;
  status: StatusValue | typeof ANY;
  duesStatus: DuesValue | typeof ANY;
  engagementLevel: EngagementValue | typeof ANY;
  joinDateFrom: string;
  joinDateTo: string;
  tags: string;
  eventAttendanceMin: string;
  eventAttendanceMax: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  isActive: true,
  status: ANY,
  duesStatus: ANY,
  engagementLevel: ANY,
  joinDateFrom: "",
  joinDateTo: "",
  tags: "",
  eventAttendanceMin: "",
  eventAttendanceMax: "",
};

const STATUS_OPTIONS: StatusValue[] = ["Active", "Inactive", "Suspended", "Pending"];
const DUES_OPTIONS: DuesValue[] = ["Current", "Overdue", "Exempt", "Unknown"];
const ENGAGEMENT_OPTIONS: EngagementValue[] = ["high", "medium", "low"];

/** Build a SegmentFilterCriteria from the form, omitting empty / "any" fields. */
function buildCriteria(form: FormState): SegmentFilterCriteria {
  const criteria: SegmentFilterCriteria = {};

  if (form.status !== ANY) criteria.status = form.status;
  if (form.duesStatus !== ANY) criteria.duesStatus = form.duesStatus;
  if (form.engagementLevel !== ANY) criteria.engagementLevel = form.engagementLevel;
  if (form.joinDateFrom) criteria.joinDateFrom = form.joinDateFrom;
  if (form.joinDateTo) criteria.joinDateTo = form.joinDateTo;

  const tags = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tags.length > 0) criteria.tags = tags;

  if (form.eventAttendanceMin.trim() !== "") {
    const min = Number(form.eventAttendanceMin);
    if (!Number.isNaN(min)) criteria.eventAttendanceMin = min;
  }
  if (form.eventAttendanceMax.trim() !== "") {
    const max = Number(form.eventAttendanceMax);
    if (!Number.isNaN(max)) criteria.eventAttendanceMax = max;
  }

  return criteria;
}

/** Hydrate a form from an existing segment's criteria. */
function formFromSegment(segment: MemberSegment): FormState {
  const c = segment.filterCriteria || {};
  return {
    name: segment.name,
    description: segment.description ?? "",
    isActive: segment.isActive,
    status: c.status ?? ANY,
    duesStatus: c.duesStatus ?? ANY,
    engagementLevel: c.engagementLevel ?? ANY,
    joinDateFrom: c.joinDateFrom ?? "",
    joinDateTo: c.joinDateTo ?? "",
    tags: c.tags ? c.tags.join(", ") : "",
    eventAttendanceMin:
      c.eventAttendanceMin !== undefined ? String(c.eventAttendanceMin) : "",
    eventAttendanceMax:
      c.eventAttendanceMax !== undefined ? String(c.eventAttendanceMax) : "",
  };
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Something went wrong. Please try again.";
}

interface SegmentFormFieldsProps {
  idPrefix: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onPreview: () => void;
  previewing: boolean;
  previewCount: number | null;
}

function SegmentFormFields({
  idPrefix,
  form,
  setForm,
  onPreview,
  previewing,
  previewCount,
}: SegmentFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="e.g., Active Members, Overdue Dues"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Optional description of who this segment targets"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor={`${idPrefix}-active`}>Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive segments are hidden from member targeting.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-active`}
          checked={form.isActive}
          onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-status`}>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, status: value as FormState["status"] }))
            }
          >
            <SelectTrigger id={`${idPrefix}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-dues`}>Dues Status</Label>
          <Select
            value={form.duesStatus}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, duesStatus: value as FormState["duesStatus"] }))
            }
          >
            <SelectTrigger id={`${idPrefix}-dues`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any dues status</SelectItem>
              {DUES_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-engagement`}>Engagement Level</Label>
          <Select
            value={form.engagementLevel}
            onValueChange={(value) =>
              setForm((f) => ({
                ...f,
                engagementLevel: value as FormState["engagementLevel"],
              }))
            }
          >
            <SelectTrigger id={`${idPrefix}-engagement`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any engagement</SelectItem>
              {ENGAGEMENT_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-join-from`}>Join Date From</Label>
          <Input
            id={`${idPrefix}-join-from`}
            type="date"
            value={form.joinDateFrom}
            onChange={(e) => setForm((f) => ({ ...f, joinDateFrom: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-join-to`}>Join Date To</Label>
          <Input
            id={`${idPrefix}-join-to`}
            type="date"
            value={form.joinDateTo}
            onChange={(e) => setForm((f) => ({ ...f, joinDateTo: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-tags`}>Tags</Label>
        <Input
          id={`${idPrefix}-tags`}
          placeholder="Comma-separated, e.g., volunteer, board"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-attend-min`}>Event Attendance Min</Label>
          <Input
            id={`${idPrefix}-attend-min`}
            type="number"
            min={0}
            value={form.eventAttendanceMin}
            onChange={(e) =>
              setForm((f) => ({ ...f, eventAttendanceMin: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-attend-max`}>Event Attendance Max</Label>
          <Input
            id={`${idPrefix}-attend-max`}
            type="number"
            min={0}
            value={form.eventAttendanceMax}
            onChange={(e) =>
              setForm((f) => ({ ...f, eventAttendanceMax: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          disabled={previewing}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {previewing ? "Previewing..." : "Preview"}
        </Button>
        {previewCount !== null && (
          <span className="text-sm text-muted-foreground">
            {previewCount} members match
          </span>
        )}
      </div>
    </div>
  );
}

export default function SegmentManager({ clubId }: { clubId: number }) {
  const [segments, setSegments] = useState<MemberSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<MemberSegment | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [previewing, setPreviewing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const loadSegments = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await memberSegmentationService.getSegments(clubId, {
        includeInactive: true,
        sortBy: "name",
        sortOrder: "asc",
      });
      setSegments(data);
    } catch (err) {
      logger.error("segmentation", "Error loading segments", { error: err, clubId });
      setLoadError("Failed to load segments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setPreviewCount(null);
  }, []);

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (segment: MemberSegment) => {
    setEditingSegment(segment);
    setForm(formFromSegment(segment));
    setFormError(null);
    setPreviewCount(null);
    setIsEditOpen(true);
  };

  const closeDialogs = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingSegment(null);
    resetForm();
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setFormError(null);
      const result = await memberSegmentationService.previewSegment(
        clubId,
        buildCriteria(form)
      );
      setPreviewCount(result.totalCount);
    } catch (err) {
      logger.error("segmentation", "Error previewing segment", { error: err, clubId });
      setFormError(errorMessage(err));
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setFormError("Segment name is required");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      const request: CreateSegmentRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        filterCriteria: buildCriteria(form),
        isActive: form.isActive,
      };
      await memberSegmentationService.createSegment(clubId, request);
      closeDialogs();
      await loadSegments();
    } catch (err) {
      logger.error("segmentation", "Error creating segment", { error: err, clubId });
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingSegment) return;
    if (!form.name.trim()) {
      setFormError("Segment name is required");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      const request: UpdateSegmentRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        filterCriteria: buildCriteria(form),
        isActive: form.isActive,
      };
      await memberSegmentationService.updateSegment(clubId, editingSegment.id, request);
      closeDialogs();
      await loadSegments();
    } catch (err) {
      logger.error("segmentation", "Error updating segment", {
        error: err,
        clubId,
        segmentId: editingSegment.id,
      });
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (segment: MemberSegment) => {
    try {
      setLoadError(null);
      await memberSegmentationService.deleteSegment(clubId, segment.id);
      await loadSegments();
    } catch (err) {
      logger.error("segmentation", "Error deleting segment", {
        error: err,
        clubId,
        segmentId: segment.id,
      });
      setLoadError(errorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading segments...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button onClick={loadSegments}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1"></div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Segment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Segments ({segments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No segments yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first segment to target members by status, dues, tags, and more.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{segment.name}</h4>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {segment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{segment.memberCount} members</Badge>
                      <Badge variant={segment.isActive ? "default" : "outline"}>
                        {segment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit segment"
                      onClick={() => openEdit(segment)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label="Delete segment">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Segment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{segment.name}&quot;? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(segment)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => (open ? setIsCreateOpen(true) : closeDialogs())}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
            <DialogDescription>
              Define filter criteria to target a group of members.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <SegmentFormFields
            idPrefix="create"
            form={form}
            setForm={setForm}
            onPreview={handlePreview}
            previewing={previewing}
            previewCount={previewCount}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !form.name.trim()}>
              {submitting ? "Creating..." : "Create Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => (open ? setIsEditOpen(true) : closeDialogs())}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>Update the segment name, description, and filters.</DialogDescription>
          </DialogHeader>
          {formError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <SegmentFormFields
            idPrefix="edit"
            form={form}
            setForm={setForm}
            onPreview={handlePreview}
            previewing={previewing}
            previewCount={previewCount}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !form.name.trim()}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
