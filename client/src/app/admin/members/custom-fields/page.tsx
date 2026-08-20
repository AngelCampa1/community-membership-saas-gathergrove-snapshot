"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
import { Plus, Edit2, Trash2, AlertCircle, FileText } from "lucide-react";
import { customFieldsService, FIELD_TYPE_OPTIONS, type FieldType, type CustomField } from "@/services/customFieldsService";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { TierGate } from "@/components/tier/TierGate";

interface FormData {
  fieldLabel: string;
  fieldType: FieldType;
  dropdownOptions: string;
}

function CustomFieldsPageContent() {
  const { user } = useAuth();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fieldLabel: "",
    fieldType: "text",
    dropdownOptions: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCustomFields = useCallback(async () => {
    if (!user?.clubId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await customFieldsService.getCustomFields(user.clubId);
      setCustomFields(data);
    } catch (err) {
      logger.error('customFields', 'Error loading custom fields', { error: err, clubId: user.clubId });
      setError("Failed to load custom fields. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    if (user?.clubId) {
      loadCustomFields();
    }
  }, [user?.clubId, loadCustomFields]);

  const validateForm = (): boolean => {
    if (!formData.fieldLabel.trim()) {
      setError("Field label is required");
      return false;
    }

    if (formData.fieldType === "select") {
      if (!formData.dropdownOptions.trim()) {
        setError("Dropdown options are required for dropdown fields");
        return false;
      }
      const options = formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(opt => opt);
      if (options.length < 2) {
        setError("Dropdown fields require at least 2 options");
        return false;
      }
    }

    return true;
  };

  const handleAdd = async () => {
    if (!user?.clubId || !validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      const newField = await customFieldsService.createCustomField(user.clubId, {
        fieldName: formData.fieldLabel,
        fieldLabel: formData.fieldLabel.trim(),
        fieldType: formData.fieldType,
        fieldOptions: formData.fieldType === "select" ? formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(opt => opt) : undefined
      });
      setCustomFields([...customFields, newField]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      logger.error('customFields', 'Error creating custom field', {
        error: err,
        clubId: user.clubId,
        fieldLabel: formData.fieldLabel,
        fieldType: formData.fieldType
      });
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create custom field. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!user?.clubId || !editingField || !validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      const updatedField = await customFieldsService.updateCustomField(user.clubId, editingField.id, {
        fieldLabel: formData.fieldLabel.trim(),
        fieldType: formData.fieldType,
        fieldOptions: formData.fieldType === "select" ? formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(opt => opt) : undefined
      });
      
      setCustomFields(customFields.map(field =>
        field.id === editingField.id ? updatedField : field
      ));
      closeDialogs();
    } catch (err: unknown) {
      logger.error('customFields', 'Error updating custom field', {
        error: err,
        clubId: user.clubId,
        fieldId: editingField?.id,
        fieldLabel: formData.fieldLabel
      });
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update custom field. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: number) => {
    if (!user?.clubId) return;
    
    try {
      setError(null);
      await customFieldsService.deleteCustomField(user.clubId, fieldId);
      setCustomFields(customFields.filter(field => field.id !== fieldId));
    } catch (err: unknown) {
      logger.error('customFields', 'Error deleting custom field', { error: err, clubId: user.clubId, fieldId });
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete custom field. Please try again.";
      setError(errorMessage);
    }
  };

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType as FieldType,
      dropdownOptions: field.fieldOptions ? field.fieldOptions.join(',') : ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fieldLabel: "",
      fieldType: "text",
      dropdownOptions: ""
    });
    setError(null);
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingField(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading custom fields...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex-1"></div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2"
              disabled={customFields.length >= 10}
            >
              <Plus className="h-4 w-4" />
              Add Custom Field
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Fields ({customFields.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No custom fields yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first custom field for member profiles.
              </p>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                disabled={customFields.length >= 10}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {field.fieldLabel}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{field.fieldType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(field.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {field.fieldType === "select" && field.fieldOptions && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Options:</p>
                        <div className="flex flex-wrap gap-1">
                          {field.fieldOptions.map((option, index) => (
                            <Badge key={option || `option-${index}`} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(field)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{field.fieldLabel}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(field.id)}
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a new custom field for member profiles. You can add up to 10 custom fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-label">Field Label</Label>
              <Input
                id="add-label"
                placeholder="e.g., Emergency Contact, Dietary Restrictions"
                value={formData.fieldLabel}
                onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-type">Field Type</Label>
              <Select
                value={formData.fieldType}
                onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value, dropdownOptions: value === "select" ? formData.dropdownOptions : "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.fieldType === "text" && "Single line text input"}
                {formData.fieldType === "number" && "Numeric input"}
                {formData.fieldType === "boolean" && "Yes/No checkbox"}
                {formData.fieldType === "select" && "Select from predefined options"}
                {formData.fieldType === "textarea" && "Multi-line text input"}
              </p>
            </div>
            {formData.fieldType === "select" && (
              <div className="space-y-2">
                <Label htmlFor="add-dropdown-options">Dropdown Options</Label>
                <Textarea
                  id="add-dropdown-options"
                  value={formData.dropdownOptions}
                  onChange={(e) => setFormData({ ...formData, dropdownOptions: e.target.value })}
                  placeholder="Enter options separated by commas
e.g., Beginner, Intermediate, Advanced"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate options with commas. Each option will become a selectable choice.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={submitting || !formData.fieldLabel.trim()}>
              {submitting ? "Adding..." : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
            <DialogDescription>
              Update the custom field information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">Field Label</Label>
              <Input
                id="edit-label"
                placeholder="e.g., Emergency Contact, Dietary Restrictions"
                value={formData.fieldLabel}
                onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Field Type</Label>
              <Select
                value={formData.fieldType}
                onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value, dropdownOptions: value === "select" ? formData.dropdownOptions : "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.fieldType === "text" && "Single line text input"}
                {formData.fieldType === "number" && "Numeric input"}
                {formData.fieldType === "boolean" && "Yes/No checkbox"}
                {formData.fieldType === "select" && "Select from predefined options"}
                {formData.fieldType === "textarea" && "Multi-line text input"}
              </p>
            </div>
            {formData.fieldType === "select" && (
              <div className="space-y-2">
                <Label htmlFor="edit-dropdown-options">Dropdown Options</Label>
                <Textarea
                  id="edit-dropdown-options"
                  value={formData.dropdownOptions}
                  onChange={(e) => setFormData({ ...formData, dropdownOptions: e.target.value })}
                  placeholder="Enter options separated by commas
e.g., Beginner, Intermediate, Advanced"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate options with commas. Each option will become a selectable choice.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !formData.fieldLabel.trim()}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomFieldsPage() {
  return (
    <TierGate requiredTier="Grow" feature="custom-fields" showUpgrade={true}>
      <CustomFieldsPageContent />
    </TierGate>
  );
}