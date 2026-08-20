import React from 'react';

export const Table = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <table className={className} {...props} data-testid="table">
    {children}
  </table>
);

export const TableHeader = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <thead className={className} {...props} data-testid="table-header">
    {children}
  </thead>
);

export const TableBody = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <tbody className={className} {...props} data-testid="table-body">
    {children}
  </tbody>
);

export const TableRow = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <tr className={className} {...props} data-testid="table-row">
    {children}
  </tr>
);

export const TableHead = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <th className={className} {...props} data-testid="table-head">
    {children}
  </th>
);

export const TableCell = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <td className={className} {...props} data-testid="table-cell">
    {children}
  </td>
);

export const TableCaption = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <caption className={className} {...props} data-testid="table-caption">
    {children}
  </caption>
);

export const TableFooter = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <tfoot className={className} {...props} data-testid="table-footer">
    {children}
  </tfoot>
);