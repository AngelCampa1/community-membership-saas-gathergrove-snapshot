import React from 'react';

// Debug test to isolate import issue
describe('BrandPreview Import Debug', () => {
  it('should import module successfully', async () => {
    try {
      const brandPreviewModule = await import('../BrandPreview');
      console.log('Module imported:', brandPreviewModule);
      console.log('BrandPreview component:', brandPreviewModule.BrandPreview);
      expect(brandPreviewModule).toBeDefined();
      expect(brandPreviewModule.BrandPreview).toBeDefined();
      expect(typeof brandPreviewModule.BrandPreview).toBe('function');
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  });

  it('should have proper exports', async () => {
    const brandPreviewModule = await import('../BrandPreview');
    expect(brandPreviewModule.BrandPreview).toBeDefined();
    expect((brandPreviewModule as any).BrandSettings).toBeUndefined(); // Interface, shouldn't be exported
    expect((brandPreviewModule as any).BrandPreviewProps).toBeUndefined(); // Interface, shouldn't be exported
  });
});