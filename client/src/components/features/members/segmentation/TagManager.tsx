"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Tag as TagIcon,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AsyncState } from '@/components/ui/async-state';
import { FormError } from '@/components/ui/form-error';
import {
  tagService,
  MemberTag,
  CreateTagRequest,
  UpdateTagRequest,
} from '@/services/tagService';
import { TEXT_ON_COLOR } from '@/utils/chartColors';
import { Member } from './types';

/** Form data captured by the tag editor (subset of the create/update request). */
interface TagFormData {
  name: string;
  color: string;
  description: string;
  isVisible: boolean;
  displayOrder: number;
}

const predefinedColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#c026d3', '#ec4899', '#f43f5e', '#6b7280',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === color ? 'border-foreground scale-110' : 'border-muted hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-8 p-1"
          aria-label="Custom color"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="font-mono"
        />
      </div>
    </div>
  );
}

interface TagFormProps {
  tag?: MemberTag;
  existingTags: MemberTag[];
  onSave: (data: TagFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function TagForm({ tag, existingTags, onSave, onCancel, isSubmitting }: TagFormProps) {
  const [formData, setFormData] = useState<TagFormData>({
    name: tag?.name || '',
    color: tag?.color || '#3b82f6',
    description: tag?.description || '',
    isVisible: tag?.isVisible ?? true,
    displayOrder: tag?.displayOrder ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (existingTags.some(t => t.name === formData.name && t.id !== tag?.id)) {
      newErrors.name = 'A tag with this name already exists';
    }

    if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'Please select a valid color';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  }, [formData, existingTags, tag?.id, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tag-name">Tag Name *</Label>
        <Input
          id="tag-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          error={errors.name}
          placeholder="e.g., VIP Member"
        />
      </div>

      <div className="space-y-2">
        <Label>Color *</Label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => setFormData(prev => ({ ...prev, color }))}
        />
        <FormError message={errors.color} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag-description">Description</Label>
        <Textarea
          id="tag-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="tag-visible"
          checked={formData.isVisible}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: !!checked }))}
        />
        <Label htmlFor="tag-visible">Visible to members</Label>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="p-3 border rounded-lg">
          <Badge style={{ backgroundColor: formData.color, color: TEXT_ON_COLOR.light }}>
            {formData.name || 'Tag Name'}
          </Badge>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {tag ? 'Save Changes' : 'Create Tag'}
        </Button>
      </div>
    </form>
  );
}

interface BulkActionsProps {
  selectedTags: number[];
  selectedMembers: number[];
  onAssignTags: (memberIds: number[], tagIds: number[]) => void;
  onRemoveTags: (memberIds: number[], tagIds: number[]) => void;
  onClearSelection: () => void;
}

function BulkActions({
  selectedTags,
  selectedMembers,
  onAssignTags,
  onRemoveTags,
  onClearSelection,
}: BulkActionsProps) {
  const hasSelection = selectedTags.length > 0 && selectedMembers.length > 0;

  if (!hasSelection) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Bulk Actions</h4>
            <p className="text-sm text-muted-foreground">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected,
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onAssignTags(selectedMembers, selectedTags)}
            >
              Assign Selected Tags
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemoveTags(selectedMembers, selectedTags)}
            >
              Remove Selected Tags
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface TagManagerProps {
  /** The club whose tags are being managed (tags are club-scoped, Expand tier). */
  clubId: number;
  selectedMembers?: Member[];
  showBulkActions?: boolean;
  onTagsChange?: (tags: MemberTag[]) => void;
}

export function TagManager({
  clubId,
  selectedMembers = [],
  showBulkActions = false,
  onTagsChange,
}: TagManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<MemberTag | null>(null);
  const [deletingTag, setDeletingTag] = useState<MemberTag | null>(null);

  const { data: tags = [], isLoading: isTagsLoading, error: tagsError, refetch: refetchTags } = useQuery({
    queryKey: ['tags', clubId],
    queryFn: () => tagService.getTags(clubId),
  });

  const { data: stats } = useQuery({
    queryKey: ['tagStats', clubId],
    queryFn: () => tagService.getTagUsageStats(clubId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (request: CreateTagRequest) => tagService.createTag(clubId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', clubId] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ tagId, request }: { tagId: number; request: UpdateTagRequest }) =>
      tagService.updateTag(clubId, tagId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', clubId] });
      setEditingTag(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: number) => tagService.deleteTag(clubId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', clubId] });
      setDeletingTag(null);
    },
  });

  const assignTagsMutation = useMutation({
    mutationFn: ({ memberIds, tagIds }: { memberIds: number[]; tagIds: number[] }) =>
      tagService.assignTagsToMembers(clubId, tagIds, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', clubId] });
      setSelectedTags([]);
    },
  });

  const removeTagsMutation = useMutation({
    mutationFn: ({ memberIds, tagIds }: { memberIds: number[]; tagIds: number[] }) =>
      tagService.removeTagsFromMembers(clubId, tagIds, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', clubId] });
      setSelectedTags([]);
    },
  });

  const memberCountOf = useCallback(
    (tag: MemberTag) => tag.usageStats?.assignedMemberCount ?? 0,
    [],
  );

  // Filtered tags
  const filteredTags = useMemo(() => {
    let filtered = tags;

    if (searchTerm) {
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => memberCountOf(b) - memberCountOf(a));
  }, [tags, searchTerm, memberCountOf]);

  // Event handlers
  const handleCreateTag = useCallback((data: TagFormData) => {
    createMutation.mutate({
      name: data.name,
      color: data.color,
      description: data.description,
      isVisible: data.isVisible,
      displayOrder: data.displayOrder,
    });
  }, [createMutation]);

  const handleUpdateTag = useCallback((data: TagFormData) => {
    if (editingTag) {
      updateMutation.mutate({
        tagId: editingTag.id,
        request: {
          name: data.name,
          color: data.color,
          description: data.description,
          isVisible: data.isVisible,
          displayOrder: data.displayOrder,
        },
      });
    }
  }, [editingTag, updateMutation]);

  const handleDeleteTag = useCallback(() => {
    if (deletingTag) {
      deleteMutation.mutate(deletingTag.id);
    }
  }, [deletingTag, deleteMutation]);

  const handleAssignTags = useCallback((memberIds: number[], tagIds: number[]) => {
    assignTagsMutation.mutate({ memberIds, tagIds });
  }, [assignTagsMutation]);

  const handleRemoveTags = useCallback((memberIds: number[], tagIds: number[]) => {
    removeTagsMutation.mutate({ memberIds, tagIds });
  }, [removeTagsMutation]);

  const handleTagSelection = useCallback((tagId: number, checked: boolean) => {
    setSelectedTags(prev =>
      checked
        ? [...prev, tagId]
        : prev.filter(id => id !== tagId)
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const selectedMemberIds = useMemo(
    () => selectedMembers.map(m => Number(m.id)).filter(id => !Number.isNaN(id)),
    [selectedMembers],
  );

  // Notify parent of tag changes
  React.useEffect(() => {
    onTagsChange?.(tags);
  }, [tags, onTagsChange]);

  const coverage = stats && stats.currentStats.totalMemberCount > 0
    ? Math.round(stats.currentStats.usagePercentage)
    : 0;

  return (
    <div className="space-y-6" role="region" aria-label="Tag management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tag Management</h2>
          <p className="text-muted-foreground">
            Create and manage tags to categorize and organize your members
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
              </DialogHeader>
              <TagForm
                existingTags={tags}
                onSave={handleCreateTag}
                onCancel={() => setIsCreateDialogOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tag Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.currentStats.assignedMemberCount}</div>
                <div className="text-sm text-muted-foreground">Tagged Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.currentStats.totalMemberCount}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{coverage}%</div>
                <div className="text-sm text-muted-foreground">Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <BulkActions
          selectedTags={selectedTags}
          selectedMembers={selectedMemberIds}
          onAssignTags={handleAssignTags}
          onRemoveTags={handleRemoveTags}
          onClearSelection={clearSelection}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search tags"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Grid */}
      <AsyncState
        loading={isTagsLoading}
        error={tagsError}
        empty={filteredTags.length === 0}
        emptyMessage="No tags found"
        emptyAction={{
          label: "Create First Tag",
          onClick: () => setIsCreateDialogOpen(true)
        }}
        onRetry={() => refetchTags()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="relative group" data-testid="tag-item">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {showBulkActions && (
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => handleTagSelection(tag.id, !!checked)}
                        aria-label={`Select ${tag.name}`}
                      />
                    )}
                    <Badge
                      style={{ backgroundColor: tag.color, color: TEXT_ON_COLOR.light }}
                      className="text-sm"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog
                      open={editingTag?.id === tag.id}
                      onOpenChange={(open) => !open && setEditingTag(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTag(tag)}
                          aria-label={`Edit ${tag.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Tag</DialogTitle>
                        </DialogHeader>
                        {editingTag && (
                          <TagForm
                            tag={editingTag}
                            existingTags={tags}
                            onSave={handleUpdateTag}
                            onCancel={() => setEditingTag(null)}
                            isSubmitting={updateMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={deletingTag?.id === tag.id}
                      onOpenChange={(open) => !open && setDeletingTag(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTag(tag)}
                          aria-label={`Delete ${tag.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{tag.name}&quot;? This will remove the tag from {memberCountOf(tag)} members.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTag}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{memberCountOf(tag)} members</span>
                  </div>

                  {tag.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      {/* Most Used Tags Section */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...tags]
                .sort((a, b) => memberCountOf(b) - memberCountOf(a))
                .slice(0, 5)
                .map((tag, index) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <Badge style={{ backgroundColor: tag.color, color: TEXT_ON_COLOR.light }}>
                        {tag.name}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {memberCountOf(tag)} members
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
