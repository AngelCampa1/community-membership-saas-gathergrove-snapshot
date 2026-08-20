'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { Download, QrCode, Share2, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { cn } from '@/lib/utils';

interface QRCodeData {
  id: string;
  eventId: number;
  type: 'check_in' | 'registration' | 'feedback' | 'info';
  data: Record<string, unknown>;
  customization: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    logo?: string;
    margin: number;
  };
  analytics: {
    scans: number;
    uniqueScans: number;
    lastScanned?: string;
    conversionRate: number;
  };
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface EventQRCodeGeneratorProps {
  eventId?: number;
  clubId: number;
  className?: string;
}

interface QRGenerationRequest {
  type: 'check_in' | 'registration' | 'feedback' | 'info';
  customData?: Record<string, unknown>;
  customization: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    logo?: string;
    margin: number;
  };
  expiresAt?: string;
}

const QR_TYPES = [
  { value: 'check_in', label: 'Event Check-In', description: 'Quick check-in for registered attendees' },
  { value: 'registration', label: 'Event Registration', description: 'Direct registration link' },
  { value: 'feedback', label: 'Feedback Collection', description: 'Post-event feedback form' },
  { value: 'info', label: 'Event Information', description: 'Event details and information' },
] as const;

const PRESET_COLORS = [
  { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Blue', fg: '#1E40AF', bg: '#EFF6FF' },
  { name: 'Green', fg: '#15803D', bg: '#F0FDF4' },
  { name: 'Purple', fg: '#7C3AED', bg: '#FAF5FF' },
  { name: 'Red', fg: '#DC2626', bg: '#FEF2F2' },
  { name: 'Orange', fg: '#EA580C', bg: '#FFF7ED' },
];

export function EventQRCodeGenerator({ eventId, clubId: _clubId, className }: EventQRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('generator');
  const [generationRequest, setGenerationRequest] = useState<QRGenerationRequest>({
    type: 'check_in',
    customization: {
      size: 200,
      foregroundColor: '#000000',
      backgroundColor: '#FFFFFF',
      margin: 4,
    },
  });
  const toast = useToast();

  const loadQRCodes = useCallback(async () => {
    if (!eventId) {
      setError('Event ID is required to load QR codes.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const codes = await eventService.getEventQRCodes(eventId);
      setQrCodes(codes as unknown as QRCodeData[]);
    } catch (err) {
      logger.error('events', 'Failed to load QR codes', { error: err, eventId });
      setError('Failed to load QR codes. Please try again.');
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const generateQRCode = async () => {
    if (!eventId) {
      toast.error('Event ID is required to generate QR codes.');
      return;
    }
    
    try {
      setGenerating(true);
      const newQRCode = await eventService.generateEventQRCode(eventId, generationRequest as any);
      setQrCodes(prev => [newQRCode as unknown as QRCodeData, ...prev]);
      toast.success(`${QR_TYPES.find(t => t.value === generationRequest.type)?.label} QR code created successfully`);
      setActiveTab('manager');
    } catch (err) {
      logger.error('events', 'Failed to generate QR code', { error: err, eventId, qrType: generationRequest.type, generationRequest });
      toast.error('Failed to generate QR code. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = async (qrCode: QRCodeData) => {
    try {
      const blob = await eventService.downloadQRCode(qrCode.id, 'png');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${qrCode.type}-${qrCode.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded successfully');
    } catch (err) {
      logger.error('events', 'Failed to download QR code', { error: err, qrCodeId: qrCode.id });
      toast.error('Failed to download QR code');
    }
  };

  const shareQRCode = async (qrCode: QRCodeData) => {
    try {
      const shareUrl = await eventService.getQRCodeShareUrl(qrCode.id);
      if (navigator.share) {
        await navigator.share({
          title: `QR Code - ${QR_TYPES.find(t => t.value === qrCode.type)?.label}`,
          text: 'Scan this QR code for quick access',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('QR code URL copied to clipboard');
      }
    } catch (err) {
      logger.error('events', 'Failed to share QR code', { error: err, qrCodeId: qrCode.id });
      toast.error('Failed to share QR code');
    }
  };

  const toggleQRCodeStatus = async (qrCode: QRCodeData) => {
    try {
      const updatedQR = await eventService.updateQRCodeStatus(qrCode.id, !qrCode.isActive);
      setQrCodes(prev => prev.map(qr => qr.id === qrCode.id ? updatedQR as unknown as QRCodeData : qr));
      toast.success(`QR code is now ${qrCode.isActive ? 'inactive' : 'active'}`);
    } catch (err) {
      logger.error('events', 'Failed to update QR code status', { error: err, qrCodeId: qrCode.id });
      toast.error('Failed to update QR code status');
    }
  };

  const deleteQRCode = async (qrCode: QRCodeData) => {
    try {
      await eventService.deleteQRCode(qrCode.id);
      setQrCodes(prev => prev.filter(qr => qr.id !== qrCode.id));
      toast.success('QR code deleted successfully');
    } catch (err) {
      logger.error('events', 'Failed to delete QR code', { error: err, qrCodeId: qrCode.id });
      toast.error('Failed to delete QR code');
    }
  };

  const bulkDownload = async () => {
    // Declared outside the try so the catch block's count log can reference it.
    // Previously activeQRs was block-scoped to the try, so any bulk-download
    // failure threw a ReferenceError in the catch before the error toast ran.
    const activeQRs = (qrCodes || []).filter(qr => qr.isActive);
    try {
      if (activeQRs.length === 0) {
        toast.warning('No active QR codes to download');
        return;
      }

      const blob = await eventService.bulkDownloadQRCodes(activeQRs.map(qr => qr.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId || 'unknown'}-qr-codes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${activeQRs.length} QR codes downloaded`);
    } catch (err) {
      logger.error('events', 'Failed to bulk download QR codes', { error: err, eventId, count: activeQRs.length });
      toast.error('Failed to download QR codes');
    }
  };

  const filteredQRCodes = (qrCodes || []).filter(qr => {
    const typeLabel = QR_TYPES.find(t => t.value === qr.type)?.label || '';
    return typeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
           qr.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getQRCodeImage = (qrCode: QRCodeData) => {
    // In a real implementation, this would return the actual QR code image URL
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${qrCode.customization.size}" height="${qrCode.customization.size}" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="${qrCode.customization.backgroundColor}"/>
        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" fill="${qrCode.customization.foregroundColor}" font-size="14">QR Code</text>
      </svg>`
    )}`;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate and manage QR codes for your event
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="qr-type">QR Code Type</Label>
                    <select
                      id="qr-type"
                      value={generationRequest.type}
                      onChange={(e) => setGenerationRequest(prev => ({ ...prev, type: e.target.value as QRGenerationRequest['type'] }))}
                      className="w-full mt-1 p-2 border border-input rounded-md"
                    >
                      {QR_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-muted-foreground mt-1">
                      {QR_TYPES.find(t => t.value === generationRequest.type)?.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qr-size">Size (px)</Label>
                      <Input
                        id="qr-size"
                        type="number"
                        min="100"
                        max="500"
                        value={generationRequest.customization.size}
                        onChange={(e) => setGenerationRequest(prev => ({
                          ...prev,
                          customization: { ...prev.customization, size: parseInt(e.target.value) || 200 }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="qr-margin">Margin</Label>
                      <Input
                        id="qr-margin"
                        type="number"
                        min="0"
                        max="20"
                        value={generationRequest.customization.margin}
                        onChange={(e) => setGenerationRequest(prev => ({
                          ...prev,
                          customization: { ...prev.customization, margin: parseInt(e.target.value) || 4 }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color Presets</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {PRESET_COLORS.map(preset => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          className="h-12 p-2"
                          onClick={() => setGenerationRequest(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              foregroundColor: preset.fg,
                              backgroundColor: preset.bg,
                            }
                          }))}
                        >
                          <div 
                            className="w-6 h-6 border border-border rounded"
                            style={{ backgroundColor: preset.bg, borderColor: preset.fg }}
                          />
                          <span className="ml-2 text-xs">{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fg-color">Foreground Color</Label>
                      <Input
                        id="fg-color"
                        type="color"
                        value={generationRequest.customization.foregroundColor}
                        onChange={(e) => setGenerationRequest(prev => ({
                          ...prev,
                          customization: { ...prev.customization, foregroundColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bg-color">Background Color</Label>
                      <Input
                        id="bg-color"
                        type="color"
                        value={generationRequest.customization.backgroundColor}
                        onChange={(e) => setGenerationRequest(prev => ({
                          ...prev,
                          customization: { ...prev.customization, backgroundColor: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2 p-4 border border-border rounded-lg bg-muted/50 flex items-center justify-center">
                      <div 
                        className="border border-border rounded"
                        style={{
                          width: Math.min(generationRequest.customization.size / 2, 150),
                          height: Math.min(generationRequest.customization.size / 2, 150),
                          backgroundColor: generationRequest.customization.backgroundColor,
                          padding: generationRequest.customization.margin,
                        }}
                      >
                        <div 
                          className="w-full h-full flex items-center justify-center text-xs"
                          style={{ color: generationRequest.customization.foregroundColor }}
                        >
                          QR Preview
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={generationRequest.expiresAt || ''}
                      onChange={(e) => setGenerationRequest(prev => ({ ...prev, expiresAt: e.target.value || undefined }))}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateQRCode} 
                disabled={generating}
                className="w-full"
                data-testid="generate-qr-button"
              >
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manager" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <Input
                    placeholder="Search QR codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                    data-testid="qr-search"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={bulkDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Bulk Download
                  </Button>
                  <Button onClick={loadQRCodes} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredQRCodes.map(qrCode => {
                  const typeInfo = QR_TYPES.find(t => t.value === qrCode.type);
                  return (
                    <Card key={qrCode.id} className={cn(
                      'relative',
                      !qrCode.isActive && 'opacity-50'
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{typeInfo?.label}</CardTitle>
                            <CardDescription className="text-xs">
                              Created {new Date(qrCode.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant={qrCode.isActive ? 'default' : 'secondary'}>
                              {qrCode.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center justify-center mb-4">
                          <img 
                            src={getQRCodeImage(qrCode)} 
                            alt="QR Code" 
                            className="w-24 h-24 border border-border rounded"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                          <div>Scans: {qrCode.analytics.scans}</div>
                          <div>Unique: {qrCode.analytics.uniqueScans}</div>
                          <div>Rate: {qrCode.analytics.conversionRate}%</div>
                          <div>Size: {qrCode.customization.size}px</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => downloadQRCode(qrCode)}
                            data-testid={`download-qr-${qrCode.id}`}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => shareQRCode(qrCode)}
                            data-testid={`share-qr-${qrCode.id}`}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setSelectedQR(qrCode)}
                            data-testid={`view-qr-${qrCode.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={qrCode.isActive ? 'secondary' : 'default'}
                            onClick={() => toggleQRCodeStatus(qrCode)}
                            data-testid={`toggle-qr-${qrCode.id}`}
                          >
                            {qrCode.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredQRCodes.length === 0 && (
                <div className="text-center py-12">
                  <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No QR Codes Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No QR codes match your search criteria.' : 'Generate your first QR code to get started.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setActiveTab('generator')}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total QR Codes</p>
                        <p className="text-2xl font-bold">{(qrCodes || []).length}</p>
                      </div>
                      <QrCode className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Codes</p>
                        <p className="text-2xl font-bold">{(qrCodes || []).filter(qr => qr.isActive).length}</p>
                      </div>
                      <Badge className="h-8 w-8 rounded-full p-0" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Scans</p>
                        <p className="text-2xl font-bold">
                          {(qrCodes || []).reduce((sum, qr) => sum + qr.analytics.scans, 0)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Conversion</p>
                        <p className="text-2xl font-bold">
                          {(qrCodes || []).length > 0
                            ? Math.round((qrCodes || []).reduce((sum, qr) => sum + qr.analytics.conversionRate, 0) / (qrCodes || []).length)
                            : 0}%
                        </p>
                      </div>
                      <Progress value={50} className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>QR Code Performance</CardTitle>
                  <CardDescription>Scan analytics and usage metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(qrCodes || []).map(qrCode => {
                      const typeInfo = QR_TYPES.find(t => t.value === qrCode.type);
                      return (
                        <div key={qrCode.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <img 
                              src={getQRCodeImage(qrCode)} 
                              alt="QR Code" 
                              className="w-12 h-12 border border-border rounded"
                            />
                            <div>
                              <p className="font-medium">{typeInfo?.label}</p>
                              <p className="text-sm text-muted-foreground">ID: {qrCode.id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{qrCode.analytics.scans} scans</p>
                            <p className="text-sm text-muted-foreground">
                              {qrCode.analytics.conversionRate}% conversion
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {selectedQR && (
          <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>QR Code Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={getQRCodeImage(selectedQR)} 
                      alt="QR Code" 
                      className="w-32 h-32 border border-border rounded"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label>Type</Label>
                      <p className="text-sm">
                        {QR_TYPES.find(t => t.value === selectedQR.type)?.label}
                      </p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={selectedQR.isActive ? 'default' : 'secondary'}>
                        {selectedQR.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm">
                        {new Date(selectedQR.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedQR.expiresAt && (
                      <div>
                        <Label>Expires</Label>
                        <p className="text-sm">
                          {new Date(selectedQR.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Total Scans</Label>
                    <p className="text-2xl font-bold">{selectedQR.analytics.scans}</p>
                  </div>
                  <div>
                    <Label>Unique Scans</Label>
                    <p className="text-2xl font-bold">{selectedQR.analytics.uniqueScans}</p>
                  </div>
                  <div>
                    <Label>Conversion Rate</Label>
                    <p className="text-2xl font-bold">{selectedQR.analytics.conversionRate}%</p>
                  </div>
                  <div>
                    <Label>Last Scanned</Label>
                    <p className="text-sm">
                      {selectedQR.analytics.lastScanned 
                        ? new Date(selectedQR.analytics.lastScanned).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => downloadQRCode(selectedQR)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={() => shareQRCode(selectedQR)} variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button 
                    onClick={() => toggleQRCodeStatus(selectedQR)} 
                    variant={selectedQR.isActive ? 'secondary' : 'default'}
                  >
                    {selectedQR.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    onClick={() => deleteQRCode(selectedQR)} 
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
