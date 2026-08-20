"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit2, Trash2, AlertCircle, FileText, X } from "lucide-react";
import { customFieldsService, FIELD_TYPE_OPTIONS, type FieldType, type CustomField } from "@/services/customFieldsService";
import { logger } from "@/lib/logger";

interface FormData {
  fieldLabel: string;
  fieldType: FieldType;
  dropdownOptions: string;
  dropdownOptionsArray: string[];
}

export default function CustomFieldsPage() {
  const { user } = useAuth();
  const clubId = user?.clubId || 0;
  
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fieldLabel: "",
    fieldType: "text",
    dropdownOptions: "",
    dropdownOptionsArray: [""]
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCustomFields = useCallback(async () => {
    if (clubId === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await customFieldsService.getCustomFields(clubId);
      setCustomFields(data);
    } catch (err) {
      logger.error('customFields', 'Error loading custom fields', { error: err, clubId });
      setError("Failed to load custom fields. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  const validateForm = (): boolean => {
    if (!formData.fieldLabel.trim()) {
      setError("Field label is required");
      return false;
    }

    // Validate field label length
    if (formData.fieldLabel.trim().length > 255) {
      setError("Field label cannot exceed 255 characters");
      return false;
    }

    // Validate field type is one of the supported types
    const validFieldTypes = FIELD_TYPE_OPTIONS.map(opt => opt.value);
    if (!validFieldTypes.includes(formData.fieldType)) {
      setError("Invalid field type selected");
      return false;
    }

    if (formData.fieldType === "select") {
      const validOptions = formData.dropdownOptionsArray.filter(opt => opt.trim());
      if (validOptions.length === 0) {
        setError("Dropdown options are required for dropdown fields");
        return false;
      }
      if (validOptions.length < 2) {
        setError("Dropdown fields require at least 2 options");
        return false;
      }
      // Check for duplicate options (case-insensitive)
      const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
      if (uniqueOptions.size !== validOptions.length) {
        setError("Dropdown options must be unique");
        return false;
      }
      // Check total length of dropdown options
      const totalOptionsLength = validOptions.join(',').length;
      if (totalOptionsLength > 2000) {
        setError("Dropdown options are too long. Please reduce the total length.");
        return false;
      }
    }

    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      const newField = await customFieldsService.createCustomField(clubId, {
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
        clubId,
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
    if (!validateForm() || !editingField) return;

    try {
      setSubmitting(true);
      setError(null);
      const updatedField = await customFieldsService.updateCustomField(
        clubId,
        editingField.id,
        {
          fieldName: formData.fieldLabel,
          fieldLabel: formData.fieldLabel.trim(),
          fieldType: formData.fieldType,
          fieldOptions: formData.fieldType === "select" ? formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(opt => opt) : undefined
        }
      );
      
      setCustomFields(customFields.map(field => 
        field.id === editingField.id ? updatedField : field
      ));
      setIsEditDialogOpen(false);
      setEditingField(null);
      resetForm();
    } catch (err: unknown) {
      logger.error('customFields', 'Error updating custom field', {
        error: err,
        clubId,
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
    try {
      setError(null);
      await customFieldsService.deleteCustomField(clubId, fieldId);
      setCustomFields(customFields.filter(field => field.id !== fieldId));
    } catch (err: unknown) {
      logger.error('customFields', 'Error deleting custom field', { error: err, clubId, fieldId });
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete custom field. Please try again.";
      setError(errorMessage);
    }
  };

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    const dropdownOptions = field.fieldOptions ? field.fieldOptions.join(',') : "";
    const optionsArray = field.fieldOptions || [""];
    setFormData({
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType as FieldType,
      dropdownOptions: dropdownOptions,
      dropdownOptionsArray: optionsArray.length > 0 ? optionsArray : [""]
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fieldLabel: "",
      fieldType: "text",
      dropdownOptions: "",
      dropdownOptionsArray: [""]
    });
    setError(null);
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingField(null);
    resetForm();
  };

  const renderFieldTypeDescription = (fieldType: FieldType) => {
    switch (fieldType) {
      case "text":
        return "Single line text input";
      case "number":
        return "Numeric input";
      case "boolean":
        return "Yes/No checkbox";
      case "select":
        return "Select from predefined options";
      case "textarea":
        return "Multi-line text input";
      default:
        return "";
    }
  };

  const renderDropdownPreview = (options: string[]) => {
    if (!options || options.length === 0) return null;
    return (
      <div className="mt-2">
        <p className="text-sm text-muted-foreground mb-1">Options:</p>
        <div className="flex flex-wrap gap-1">
          {options.map((option, index) => (
            <Badge key={`option-${index}-${option}`} variant="outline" className="text-xs">
              {option}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custom Member Fields</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custom Member Fields</h1>
          <p className="text-muted-foreground mt-2">
            Define custom fields for member profiles (max 10 fields)
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={customFields.length >= 10}
              onClick={() => {
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Field</DialogTitle>
              <DialogDescription>
                Create a new custom field for member profiles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fieldLabel">Field Label</Label>
                <Input
                  id="fieldLabel"
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  placeholder="e.g., Emergency Contact Name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fieldType">Field Type</Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(value: FieldType) => setFormData({ 
                  ...formData, 
                  fieldType: value, 
                  dropdownOptions: value === "select" ? formData.dropdownOptions : "",
                  dropdownOptionsArray: value === "select" ? (formData.dropdownOptionsArray.length > 0 ? formData.dropdownOptionsArray : [""]) : [""]
                })}
                >
                  <SelectTrigger className="mt-1">
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
                <p className="text-sm text-muted-foreground mt-1">
                  {renderFieldTypeDescription(formData.fieldType)}
                </p>
              </div>
              {formData.fieldType === "select" && (
                <div className="space-y-3">
                  <Label>Dropdown Options</Label>
                  <div className="space-y-2">
                    {formData.dropdownOptionsArray.map((option, index) => (
                      <div key={`option-${index}-${option}`} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.dropdownOptionsArray];
                            newOptions[index] = e.target.value;
                            setFormData({ 
                              ...formData, 
                              dropdownOptionsArray: newOptions,
                              dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                            });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        {formData.dropdownOptionsArray.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newOptions = formData.dropdownOptionsArray.filter((_, i) => i !== index);
                              setFormData({ 
                                ...formData, 
                                dropdownOptionsArray: newOptions,
                                dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...formData.dropdownOptionsArray, ""];
                      setFormData({ 
                        ...formData, 
                        dropdownOptionsArray: newOptions,
                        dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                      });
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Add at least 2 options for the dropdown field.
                  </p>
                </div>
              )}
            </div>
            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting}>
                {submitting ? "Creating..." : "Create Field"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isAddDialogOpen && !isEditDialogOpen && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {customFields.length >= 10 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum limit of 10 custom fields. Delete existing fields to add new ones.
          </AlertDescription>
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
                onClick={() => setIsAddDialogOpen(true)}
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
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                    {field.fieldType === "select" && field.fieldOptions && 
                      renderDropdownPreview(field.fieldOptions)
                    }
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
                            Are you sure you want to delete &quot;{field.fieldLabel}&quot;? This action cannot be undone and will remove all member data for this field.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(field.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
            <DialogDescription>
              Update the custom field details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFieldLabel">Field Label</Label>
              <Input
                id="editFieldLabel"
                value={formData.fieldLabel}
                onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                placeholder="e.g., Emergency Contact Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editFieldType">Field Type</Label>
              <Select
                value={formData.fieldType}
                onValueChange={(value: FieldType) => setFormData({ 
                  ...formData, 
                  fieldType: value, 
                  dropdownOptions: value === "select" ? formData.dropdownOptions : "",
                  dropdownOptionsArray: value === "select" ? (formData.dropdownOptionsArray.length > 0 ? formData.dropdownOptionsArray : [""]) : [""]
                })}
              >
                <SelectTrigger className="mt-1">
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
              <p className="text-sm text-muted-foreground mt-1">
                {renderFieldTypeDescription(formData.fieldType)}
              </p>
            </div>
            {formData.fieldType === "select" && (
              <div className="space-y-3">
                <Label>Dropdown Options</Label>
                <div className="space-y-2">
                  {formData.dropdownOptionsArray.map((option, index) => (
                    <div key={`edit-option-${index}-${option}`} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.dropdownOptionsArray];
                          newOptions[index] = e.target.value;
                          setFormData({ 
                            ...formData, 
                            dropdownOptionsArray: newOptions,
                            dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                          });
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.dropdownOptionsArray.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = formData.dropdownOptionsArray.filter((_, i) => i !== index);
                            setFormData({ 
                              ...formData, 
                              dropdownOptionsArray: newOptions,
                              dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...formData.dropdownOptionsArray, ""];
                    setFormData({ 
                      ...formData, 
                      dropdownOptionsArray: newOptions,
                      dropdownOptions: newOptions.filter(opt => opt.trim()).join(', ')
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
                <p className="text-sm text-muted-foreground">
                  Add at least 2 options for the dropdown field.
                </p>
              </div>
            )}
          </div>
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Updating..." : "Update Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 