"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CustomField } from "@/services/customFieldsService";

interface CustomFieldInputProps {
  field: CustomField;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomFieldInput({ 
  field, 
  value, 
  onChange, 
  placeholder, 
  disabled = false 
}: CustomFieldInputProps) {
  const fieldId = `custom-field-${field.id}`;

  // Handle different field types
  switch (field.fieldType) {
    case "text":
      return (
        <Input
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${field.fieldLabel.toLowerCase()}`}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <Input
          id={fieldId}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${field.fieldLabel.toLowerCase()}`}
          disabled={disabled}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={fieldId}
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
            disabled={disabled}
          />
          <Label htmlFor={fieldId} className="text-sm font-normal">
            Yes
          </Label>
        </div>
      );

    case "select":
      if (!field.fieldOptions) {
        return (
          <div className="text-sm text-muted-foreground italic">
            No options configured for this dropdown field
          </div>
        );
      }
      
      const options = field.fieldOptions
        .filter(opt => opt.length > 0)
        .filter((opt, index, arr) => arr.indexOf(opt) === index); // Remove duplicates
      
      // If no valid options after filtering, show error message
      if (options.length === 0) {
        return (
          <div className="text-sm text-destructive italic">
            Error: No valid options found. Please check the dropdown configuration.
          </div>
        );
      }
      
      return (
        <Select
          value={value || ""}
          onValueChange={(selectedValue) => {
            // Don't store empty string selections, let parent handle empty values
            onChange(selectedValue === "" ? "" : selectedValue);
          }}
          disabled={disabled}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder={placeholder || `Select ${field.fieldLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              <span className="text-muted-foreground">None selected</span>
            </SelectItem>
            {options.map((option, index) => {
              // Ensure we have a valid option value, skip empty ones
              if (!option.trim()) return null;
              return (
                <SelectItem key={`${field.id}-${option}-${index}`} value={option.trim()}>
                  {option.trim()}
                </SelectItem>
              );
            }).filter(Boolean)}
          </SelectContent>
        </Select>
      );

    case "textarea":
      return (
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${field.fieldLabel.toLowerCase()}`}
          rows={3}
          disabled={disabled}
        />
      );

    default:
      // Fallback to text input for unknown field types
      return (
        <Input
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${field.fieldLabel.toLowerCase()}`}
          disabled={disabled}
        />
      );
  }
}

// Helper function to format field value for display (non-editing mode)
export function formatCustomFieldValue(field: CustomField, value: string): string {
  if (!value) return '—';
  
  switch (field.fieldType) {
    case "boolean":
      return value === "true" ? "Yes" : "No";
    default:
      return value;
  }
} 