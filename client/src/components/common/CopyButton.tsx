import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  buttonText = 'Copy',
  className,
  variant = 'outline',
  size = 'default',
  onCopySuccess,
  onCopyError,
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // BUG FIX: Track timeout refs for cleanup on unmount
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
    // Prevent multiple simultaneous copies
    if (isProcessing) return;

    setIsProcessing(true);
    setError(false);

    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopySuccess?.();

        // Reset after 2 seconds - use ref for cleanup
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      } else {
        // Fallback for older browsers
        const success = fallbackCopy(text);
        if (success) {
          setCopied(true);
          onCopySuccess?.();

          // Use ref for cleanup
          if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
          copiedTimeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, 2000);
        } else {
          throw new Error('Clipboard operation failed');
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy');
      setError(true);
      onCopyError?.(error);

      // Reset error state after 3 seconds - use ref for cleanup
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError(false);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const fallbackCopy = (text: string): boolean => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      return successful;
    } catch {
      return false;
    }
  };

  const getButtonText = () => {
    if (error) return 'Failed to copy';
    if (copied) return 'Copied!';
    return buttonText;
  };

  const getAriaLabel = () => {
    if (error) return 'Failed to copy to clipboard';
    if (copied) return 'Copied to clipboard';
    return 'Copy to clipboard';
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className, variant, size)}
      onClick={copyToClipboard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          copyToClipboard();
        }
      }}
      disabled={isProcessing}
      aria-label={getAriaLabel()}
      type="button"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" data-icon="check" aria-hidden="true" />
          {getButtonText()}
        </>
      ) : error ? (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
          {getButtonText()}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
          {getButtonText()}
        </>
      )}
    </Button>
  );
};

export default CopyButton;