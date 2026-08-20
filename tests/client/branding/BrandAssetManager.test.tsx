import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandAssetManager } from '../../../client/src/components/branding/BrandAssetManager';

// Mock file operations
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
global.fetch = jest.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-123')
  }
});

describe('BrandAssetManager', () => {
  const mockOnAssetUpload = jest.fn();
  const mockOnAssetDelete = jest.fn();
  const mockOnAssetUpdate = jest.fn();
  const mockOnError = jest.fn();

  const mockAssets = [
    {
      id: '1',
      name: 'logo.png',
      type: 'image/png',
      size: 51200, // 50KB
      url: 'https://example.com/assets/logo.png',
      category: 'logos',
      uploadedAt: '2023-10-01T10:00:00Z',
      dimensions: { width: 300, height: 200 }
    },
    {
      id: '2',
      name: 'banner.jpg',
      type: 'image/jpeg',
      size: 153600, // 150KB
      url: 'https://example.com/assets/banner.jpg',
      category: 'banners',
      uploadedAt: '2023-10-02T14:30:00Z',
      dimensions: { width: 1200, height: 400 }
    },
    {
      id: '3',
      name: 'icon.svg',
      type: 'image/svg+xml',
      size: 2048, // 2KB
      url: 'https://example.com/assets/icon.svg',
      category: 'icons',
      uploadedAt: '2023-10-03T09:15:00Z',
      dimensions: { width: 64, height: 64 }
    }
  ];

  const defaultProps = {
    assets: mockAssets,
    onAssetUpload: mockOnAssetUpload,
    onAssetDelete: mockOnAssetDelete,
    onAssetUpdate: mockOnAssetUpdate,
    onError: mockOnError,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    storageUsed: 206848, // ~202KB
    storageLimit: 100 * 1024 * 1024 // 100MB
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('renders asset manager interface', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /brand asset manager/i })).toBeInTheDocument();
      expect(screen.getByText(/manage your brand assets/i)).toBeInTheDocument();
    });

    it('displays storage usage information', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByText(/storage used/i)).toBeInTheDocument();
      expect(screen.getByText(/202 KB of 100 MB/i)).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0.2'); // ~0.2%
    });

    it('shows asset category filters', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /all categories/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /banners/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /icons/i })).toBeInTheDocument();
    });

    it('displays upload area', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByText(/drop files here or click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/png, jpg, svg, webp up to 5mb/i)).toBeInTheDocument();
    });
  });

  describe('Asset Display', () => {
    it('renders asset grid with all assets', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByText('logo.png')).toBeInTheDocument();
      expect(screen.getByText('banner.jpg')).toBeInTheDocument();
      expect(screen.getByText('icon.svg')).toBeInTheDocument();
    });

    it('shows asset details and metadata', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByText('50 KB')).toBeInTheDocument();
      expect(screen.getByText('150 KB')).toBeInTheDocument();
      expect(screen.getByText('2 KB')).toBeInTheDocument();
      
      expect(screen.getByText('300 × 200')).toBeInTheDocument();
      expect(screen.getByText('1200 × 400')).toBeInTheDocument();
      expect(screen.getByText('64 × 64')).toBeInTheDocument();
    });

    it('displays asset preview thumbnails', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const logoThumbnail = screen.getByAltText('logo.png thumbnail');
      const bannerThumbnail = screen.getByAltText('banner.jpg thumbnail');
      const iconThumbnail = screen.getByAltText('icon.svg thumbnail');
      
      expect(logoThumbnail).toHaveAttribute('src', 'https://example.com/assets/logo.png');
      expect(bannerThumbnail).toHaveAttribute('src', 'https://example.com/assets/banner.jpg');
      expect(iconThumbnail).toHaveAttribute('src', 'https://example.com/assets/icon.svg');
    });

    it('shows asset action buttons', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const copyButtons = screen.getAllByRole('button', { name: /copy url/i });
      
      expect(downloadButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
      expect(copyButtons).toHaveLength(3);
    });
  });

  describe('Asset Filtering', () => {
    it('filters assets by category', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const logosFilter = screen.getByRole('button', { name: /logos/i });
      await userEvent.click(logosFilter);
      
      expect(screen.getByText('logo.png')).toBeInTheDocument();
      expect(screen.queryByText('banner.jpg')).not.toBeInTheDocument();
      expect(screen.queryByText('icon.svg')).not.toBeInTheDocument();
    });

    it('searches assets by name', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search assets/i);
      await userEvent.type(searchInput, 'logo');
      
      await waitFor(() => {
        expect(screen.getByText('logo.png')).toBeInTheDocument();
        expect(screen.queryByText('banner.jpg')).not.toBeInTheDocument();
        expect(screen.queryByText('icon.svg')).not.toBeInTheDocument();
      });
    });

    it('shows asset count for each category', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      expect(screen.getByText(/logos \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/banners \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/icons \(1\)/i)).toBeInTheDocument();
    });

    it('shows empty state when no assets match filter', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search assets/i);
      await userEvent.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText(/no assets found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('handles file selection via input', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-asset', url: 'https://example.com/new-asset.png' })
      });
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const file = new File(['test'], 'new-logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, file);
      
      expect(mockOnAssetUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'new-logo.png',
          type: 'image/png'
        })
      );
    });

    it('handles drag and drop upload', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-asset', url: 'https://example.com/new-asset.png' })
      });
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const dropZone = screen.getByTestId('upload-drop-zone');
      const file = new File(['test'], 'dropped-logo.png', { type: 'image/png' });
      
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-primary');
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      await waitFor(() => {
        expect(mockOnAssetUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'dropped-logo.png',
            type: 'image/png'
          })
        );
      });
    });

    it('validates file size limits', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, oversizedFile);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File size exceeds 5 MB limit')
      );
    });

    it('validates file types', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      
      await userEvent.upload(fileInput, invalidFile);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type')
      );
    });

    it('prevents upload when storage limit exceeded', async () => {
      const propsNearLimit = {
        ...defaultProps,
        storageUsed: 99 * 1024 * 1024 // 99MB of 100MB limit
      };
      
      render(<BrandAssetManager {...propsNearLimit} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const file = new File(['x'.repeat(2 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, file);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Storage limit exceeded')
      );
    });
  });

  describe('Asset Management', () => {
    it('copies asset URL to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const copyButtons = screen.getAllByRole('button', { name: /copy url/i });
      await userEvent.click(copyButtons[0]);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/assets/logo.png'
      );
      expect(screen.getByText(/url copied/i)).toBeInTheDocument();
    });

    it('downloads asset file', async () => {
      // Mock URL.createObjectURL and link click
      const mockCreateElement = jest.spyOn(document, 'createElement');
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
        style: {},
        href: '',
        download: ''
      };
      mockCreateElement.mockReturnValue(mockLink as any);
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      await userEvent.click(downloadButtons[0]);
      
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('logo.png');
    });

    it('deletes asset with confirmation', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);
      
      // Confirm deletion in modal
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await userEvent.click(confirmButton);
      
      expect(mockOnAssetDelete).toHaveBeenCalledWith('1');
    });

    it('cancels asset deletion', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);
      
      // Cancel deletion in modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
      
      expect(mockOnAssetDelete).not.toHaveBeenCalled();
    });

    it('renames asset inline', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const assetName = screen.getByText('logo.png');
      await userEvent.dblClick(assetName);
      
      const nameInput = screen.getByDisplayValue('logo.png');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'company-logo.png');
      await userEvent.keyboard('{Enter}');
      
      expect(mockOnAssetUpdate).toHaveBeenCalledWith('1', {
        name: 'company-logo.png'
      });
    });
  });

  describe('Asset Organization', () => {
    it('allows bulk selection of assets', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await userEvent.click(selectAllCheckbox);
      
      const assetCheckboxes = screen.getAllByRole('checkbox', { name: /select asset/i });
      assetCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('provides bulk delete functionality', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      // Select multiple assets
      const assetCheckboxes = screen.getAllByRole('checkbox', { name: /select asset/i });
      await userEvent.click(assetCheckboxes[0]);
      await userEvent.click(assetCheckboxes[1]);
      
      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      await userEvent.click(bulkDeleteButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await userEvent.click(confirmButton);
      
      expect(mockOnAssetDelete).toHaveBeenCalledTimes(2);
    });

    it('changes asset category', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const moreButton = screen.getAllByRole('button', { name: /more options/i })[0];
      await userEvent.click(moreButton);
      
      const changeCategoryButton = screen.getByRole('menuitem', { name: /change category/i });
      await userEvent.click(changeCategoryButton);
      
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await userEvent.selectOptions(categorySelect, 'banners');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);
      
      expect(mockOnAssetUpdate).toHaveBeenCalledWith('1', {
        category: 'banners'
      });
    });
  });

  describe('Security Features', () => {
    it('scans uploaded files for malware', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          safe: true,
          id: 'new-asset',
          url: 'https://example.com/new-asset.png'
        })
      });
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const file = new File(['test'], 'new-logo.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, file);
      
      expect(screen.getByText(/scanning for security threats/i)).toBeInTheDocument();
    });

    it('blocks malicious file uploads', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'File contains malicious content',
          safe: false
        })
      });
      
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      const file = new File(['malicious'], 'virus.png', { type: 'image/png' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('malicious content')
        );
      });
    });

    it('validates file content matches extension', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/upload files/i);
      // File with PNG extension but wrong MIME type
      const file = new File(['test'], 'fake-image.png', { type: 'text/plain' });
      
      await userEvent.upload(fileInput, file);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File content does not match extension')
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all interactive elements', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button', { name: /upload files/i });
      const searchInput = screen.getByLabelText(/search assets/i);
      const categoryFilters = screen.getByRole('group', { name: /filter by category/i });
      
      expect(uploadArea).toHaveAttribute('aria-describedby');
      expect(searchInput).toHaveAttribute('aria-describedby');
      expect(categoryFilters).toBeInTheDocument();
    });

    it('supports keyboard navigation for asset grid', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const firstAsset = screen.getAllByRole('button', { name: /asset options/i })[0];
      firstAsset.focus();
      
      expect(firstAsset).toHaveFocus();
      
      fireEvent.keyDown(firstAsset, { key: 'ArrowRight' });
      
      const secondAsset = screen.getAllByRole('button', { name: /asset options/i })[1];
      expect(secondAsset).toHaveFocus();
    });

    it('provides screen reader announcements for actions', async () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const copyButtons = screen.getAllByRole('button', { name: /copy url/i });
      await userEvent.click(copyButtons[0]);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/url copied to clipboard/i);
    });
  });

  describe('Performance Optimization', () => {
    it('virtualizes large asset lists', () => {
      const manyAssets = Array.from({ length: 1000 }, (_, i) => ({
        id: `asset-${i}`,
        name: `file-${i}.png`,
        type: 'image/png',
        size: 1024,
        url: `https://example.com/file-${i}.png`,
        category: 'misc',
        uploadedAt: new Date().toISOString(),
        dimensions: { width: 100, height: 100 }
      }));
      
      const propsWithManyAssets = {
        ...defaultProps,
        assets: manyAssets
      };
      
      render(<BrandAssetManager {...propsWithManyAssets} />);
      
      // Should only render visible assets
      const visibleAssets = screen.getAllByText(/file-\d+\.png/);
      expect(visibleAssets.length).toBeLessThan(50); // Virtualized view
    });

    it('lazy loads asset thumbnails', () => {
      render(<BrandAssetManager {...defaultProps} />);
      
      const thumbnails = screen.getAllByRole('img', { name: /thumbnail/i });
      thumbnails.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('loading', 'lazy');
      });
    });

    it('debounces search input', async () => {
      const searchSpy = jest.fn();
      const propsWithSearch = {
        ...defaultProps,
        onSearch: searchSpy
      };
      
      render(<BrandAssetManager {...propsWithSearch} />);
      
      const searchInput = screen.getByPlaceholderText(/search assets/i);
      
      // Rapid typing should debounce
      await userEvent.type(searchInput, 'logo');
      
      // Should only call once after debounce period
      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
