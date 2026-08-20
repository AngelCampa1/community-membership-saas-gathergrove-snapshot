"use client";

import React, { useCallback } from 'react';
import { Textarea } from './textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

/**
 * Rich Text Editor Component
 * 
 * A simplified rich text editor implementation using textarea
 * for React 19 compatibility. In production, this could be
 * replaced with a more sophisticated editor like TipTap or Quill.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  rows = 6,
  ...props
}: RichTextEditorProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="min-h-[120px] resize-y"
        data-testid="rich-text-editor"
        {...props}
      />
      
      {/* Simple formatting help text */}
      <p className="text-xs text-muted-foreground">
        Supports plain text formatting. Rich text features coming soon.
      </p>
    </div>
  );
}