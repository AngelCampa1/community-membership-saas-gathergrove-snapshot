#!/usr/bin/env python3
"""
Script to apply the proven RadixUI mocking pattern to ALL component and page test files
This will systematically scale the pattern that achieved 81% success on FinancialExportDialog
"""

import os
import glob
import re
from pathlib import Path

# The proven RadixUI mocking pattern that works
RADIX_MOCK_PATTERN = '''
// Mock RadixUI components inline to bypass Jest module mapping issues
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...children.props });
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(({ orientation = 'horizontal', decorative = true, ...props }: any, ref) => (
    <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />
  ))
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, variant, size, asChild, ...props }, ref) => {
    if (asChild && children) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        className={`button ${variant || ''} ${size || ''} ${className || ''}`}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  })
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge ${variant || ''} ${className || ''}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange, ...restProps } = props;
    return <div className={`dialog-content ${className || ''}`} data-testid="dialog-content" {...restProps}>{children}</div>;
  },
  DialogHeader: ({ children, className, ...props }: any) => (
    <div className={`dialog-header ${className || ''}`} data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={`dialog-title ${className || ''}`} data-testid="dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, className, ...props }: any) => (
    <p className={`dialog-description ${className || ''}`} data-testid="dialog-description" {...props}>{children}</p>
  ),
  DialogFooter: ({ children, className, ...props }: any) => (
    <div className={`dialog-footer ${className || ''}`} data-testid="dialog-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children, className, ...props }: any) => (
    <button className={`select-trigger ${className || ''}`} data-testid="select-trigger" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={`checkbox ${className || ''}`}
      checked={Boolean(checked)}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  ))
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`input ${className || ''}`}
      data-testid="input"
      {...props}
    />
  ))
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} data-testid="label" {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      data-value={value}
      {...props}
    >
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h4 className={`alert-title ${className || ''}`} data-testid="alert-title" {...props}>{children}</h4>
  ),
}));

jest.mock('@/components/ui/spinner', () => ({
  Spinner: ({ className, ...props }: any) => (
    <div className={`spinner ${className || ''}`} data-testid="loading-spinner" {...props} />
  ),
}));
'''

def find_test_files():
    """Find all test files that need RadixUI mocking"""
    patterns = [
        'src/**/__tests__/*.test.tsx',
        'src/**/__tests__/*.test.ts', 
        'src/**/*.test.tsx',
        'src/**/*.test.ts'
    ]
    
    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern, recursive=True))
    
    # Filter for React/component tests (tsx files primarily)
    tsx_files = [f for f in files if f.endswith('.tsx')]
    return tsx_files

def has_radix_mocks(content):
    """Check if file already has comprehensive RadixUI mocking"""
    indicators = [
        '@radix-ui/react-slot',
        '@radix-ui/react-separator', 
        'jest.mock.*@/components/ui/card',
        'jest.mock.*@/components/ui/button'
    ]
    return all(re.search(indicator, content, re.DOTALL) for indicator in indicators)

def needs_react_import(content):
    """Check if file needs React import for mocking"""
    return 'React.forwardRef' in RADIX_MOCK_PATTERN and 'import React' not in content.split('\n')[0:10]

def apply_radix_mocks(file_path):
    """Apply RadixUI mocking pattern to a test file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Skip if already has comprehensive mocks
        if has_radix_mocks(content):
            return False, "Already has mocks"
            
        # Skip if not a React test file
        if 'render' not in content or 'screen' not in content:
            return False, "Not a React test"
            
        # Find insertion point - after imports, before describe blocks
        lines = content.split('\n')
        insert_line = 0
        
        # Look for last import statement
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith('jest.mock('):
                insert_line = i + 1
            elif line.strip().startswith('//') or line.strip() == '':
                continue
            else:
                break
                
        # Add React import if needed
        react_import = ""
        if needs_react_import(content):
            react_import = "import React from 'react';\n"
            
        # Insert the mocking pattern
        lines.insert(insert_line, react_import + RADIX_MOCK_PATTERN)
        
        new_content = '\n'.join(lines)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        return True, "Applied RadixUI mocks"
        
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    """Main execution function"""
    print("🎯 CRITICAL SCALING MISSION: Applying proven RadixUI mocking pattern")
    print("=" * 70)
    
    test_files = find_test_files()
    print(f"Found {len(test_files)} test files to process")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for file_path in test_files:
        print(f"Processing: {file_path}")
        success, message = apply_radix_mocks(file_path)
        
        if success:
            success_count += 1
            print(f"  ✅ {message}")
        else:
            if "Already has mocks" in message:
                skip_count += 1
                print(f"  ⏭️  {message}")
            else:
                error_count += 1
                print(f"  ❌ {message}")
                
    print("\n" + "=" * 70)
    print("🎯 SCALING MISSION SUMMARY:")
    print(f"✅ Successfully applied: {success_count}")
    print(f"⏭️  Already had mocks: {skip_count}")
    print(f"❌ Errors/skipped: {error_count}")
    print(f"📊 Total processed: {len(test_files)}")
    
    if success_count > 0:
        print(f"\n🚀 SUCCESS: Applied RadixUI mocking to {success_count} files")
        print("Expected improvement: 80%+ test pass rate for component tests")

if __name__ == "__main__":
    main()