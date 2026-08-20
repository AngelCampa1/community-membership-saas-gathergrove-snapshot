import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Reusable page header component
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
}) => {
  return (
  <div className="border-b border-border pb-5 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center space-x-3">{children}</div>}
      </div>
    </div>
  );
}; 