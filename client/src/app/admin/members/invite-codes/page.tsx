'use client';

import { useState, useEffect, useCallback } from'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card';
import { Button } from'@/components/ui/button';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from'@/components/ui/select';
import { Textarea } from'@/components/ui/textarea';
import { Switch } from'@/components/ui/switch';
import { Alert, AlertDescription } from'@/components/ui/alert';
import { Badge } from'@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from'@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from'@/components/ui/table';
import { Loader2, Plus, Eye, Edit, Trash2, Copy, AlertCircle, Calendar, Users, Link } from'lucide-react';
import { format } from'date-fns';
import Image from'next/image';
import { useAuth } from'@/hooks/useAuth';
import inviteCodeService, { CreateInviteCodeRequest, InviteCodeResponse } from'@/services/inviteCodeService';
import membershipTypeService, { MembershipTypeResponse } from'@/services/membershipTypeService';
import { toast } from'sonner';
import { logger } from'@/lib/logger';

interface CreateInviteCodeData {
  name: string;
  description: string;
  membershipTypeId: number;
  expiresAt: string;
  maxUses?: number;
  isActive: boolean;
}

export default function InviteCodesPage() {
  const { user } = useAuth();
  const [inviteCodes, setInviteCodes] = useState<InviteCodeResponse[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInviteCode, setSelectedInviteCode] = useState<InviteCodeResponse | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inviteCodeToDelete, setInviteCodeToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateInviteCodeData>({
    name:'',
    description:'',
    membershipTypeId: 0,
    expiresAt:'',
    maxUses: undefined,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    if (!user?.clubId) {
      setError('Unable to load club information. Please try refreshing the page.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Load invite codes and membership types in parallel
      const [inviteCodesData, membershipTypesData] = await Promise.all([
        inviteCodeService.getInviteCodes(user.clubId),
        membershipTypeService.getMembershipTypes(user.clubId)
      ]);

      setInviteCodes(inviteCodesData || []);
      setMembershipTypes(membershipTypesData || []);
    } catch (err) {
      logger.error('members','Error loading invite codes and membership types', { error: err, clubId: user.clubId });
      setError('Unable to load invite codes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (field: keyof CreateInviteCodeData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) {
      setError('Unable to load club information. Please try refreshing the page.');
      return;
    }

    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.membershipTypeId) {
      setError('Membership type is required');
      return;
    }
    if (!formData.expiresAt) {
      setError('Expiration date is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const createRequest: CreateInviteCodeRequest = {
        name: formData.name,
        description: formData.description || undefined,
        membershipTypeId: formData.membershipTypeId,
        expiresAt: formData.expiresAt,
        maxUses: formData.maxUses || undefined,
        isActive: formData.isActive,
      };

      await inviteCodeService.createInviteCode(user.clubId, createRequest);

      toast.success('Invite code created successfully!');
      setFormData({
        name:'',
        description:'',
        membershipTypeId: 0,
        expiresAt:'',
        maxUses: undefined,
        isActive: true,
      });
      setIsCreateDialogOpen(false);
      loadData(); // Reload the list
    } catch (err) {
      logger.error('members','Error creating invite code', { error: err, clubId: user?.clubId, formData });
      setError('Failed to create invite code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInviteCodeStatus = async (id: number) => {
    if (!user?.clubId) {
      setError('Unable to load club information. Please try refreshing the page.');
      return;
    }

    try {
      await inviteCodeService.toggleInviteCodeStatus(user.clubId, id);
      toast.success('Invite code status updated successfully!');
      loadData(); // Reload the list
    } catch (err) {
      logger.error('members','Error updating invite code status', { error: err, clubId: user.clubId, inviteCodeId: id });
      setError('Failed to update invite code. Please try again.');
    }
  };

  const deleteInviteCode = async () => {
    if (!inviteCodeToDelete || !user?.clubId) {
      setError('Unable to delete invite code. Please try refreshing the page.');
      return;
    }

    try {
      await inviteCodeService.deleteInviteCode(user.clubId, inviteCodeToDelete);
      toast.success('Invite code deleted successfully!');
      setIsDeleteDialogOpen(false);
      setInviteCodeToDelete(null);
      loadData(); // Reload the list
    } catch (err) {
      logger.error('members','Error deleting invite code', { error: err, clubId: user.clubId, inviteCodeId: inviteCodeToDelete });
      setError('Failed to delete invite code. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString),'MMM dd, yyyy HH:mm');
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const isAtLimit = (inviteCode: InviteCodeResponse) => {
    return inviteCode.maxUses !== null && inviteCode.currentUses >= inviteCode.maxUses!;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Invite Codes
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage invite codes for member registration
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95">
              <Plus className="h-4 w-4 mr-2" />
              Create Invite Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md glass-strong border-border/50 backdrop-blur-xl shadow-xl">
            <form onSubmit={handleCreateInviteCode}>
              <DialogHeader>
                <DialogTitle>Create New Invite Code</DialogTitle>
                <DialogDescription>
                  Create a new invite code for member registration
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Annual Meeting Registration"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description for internal use"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label id="membershipType-label">Membership Type *</Label>
                  <Select 
                    value={formData.membershipTypeId > 0 ? formData.membershipTypeId.toString() :""} 
                    onValueChange={(value) => handleInputChange('membershipTypeId', parseInt(value))}
                  >
                    <SelectTrigger aria-labelledby="membershipType-label">
                      <SelectValue placeholder="Select membership type" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipTypes.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {isLoading ?'Loading membership types...' :'No membership types available'}
                        </div>
                      ) : (
                        membershipTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name} - ${type.duesAmount}/{type.duesFrequency}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At *</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={formData.maxUses ||''}
                      onChange={(e) => handleInputChange('maxUses', e.target.value ? parseInt(e.target.value) :'')}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="glass-soft border-border/50 hover:glass transition-all duration-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95 disabled:opacity-50">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : ('Create Invite Code'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {/* Invite Codes List */}
      <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
              <Link className="h-5 w-5 text-primary" />
            </div>
            <span>Invite Codes</span>
          </CardTitle>
          <CardDescription>
            Manage your club&apos;s invite codes for member registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No invite codes created yet. Create your first invite code to get started.
              </p>
            </div>
          ) : (
            <div className="glass border border-border/50 rounded-lg overflow-hidden shadow-lg">
              <Table>
                <TableHeader className="bg-gradient-to-r from-muted/60 to-muted/40 backdrop-blur-md border-b border-border/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground px-4 py-4">Name</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">Code</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">Membership Type</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">Usage</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">Expires</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 py-4">Status</TableHead>
                    <TableHead className="text-right font-semibold text-foreground px-4 py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {inviteCodes.map((inviteCode) => (
                  <TableRow key={inviteCode.id} className="hover:bg-primary/5 transition-all duration-200 border-border/30">
                    <TableCell className="font-medium px-4 py-3">
                      {inviteCode.name}
                      {inviteCode.description && (
                        <p className="text-sm text-muted-foreground">{inviteCode.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <code className="glass-soft px-2 py-1 rounded text-sm font-mono border border-border/30">
                          {inviteCode.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(inviteCode.code)}
                          className="hover:bg-primary/10 transition-colors duration-200 rounded-full"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{inviteCode.membershipTypeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {inviteCode.currentUses}
                          {inviteCode.maxUses && ` / ${inviteCode.maxUses}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span className={isExpired(inviteCode.expiresAt) ?'text-destructive' :''}>
                          {formatDate(inviteCode.expiresAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col space-y-1">
                        <Badge 
                          variant={inviteCode.isActive ?'default' :'secondary'}
                          className="glass-soft border-border/30 shadow-sm"
                        >
                          {inviteCode.isActive ?'Active' :'Inactive'}
                        </Badge>
                        {isExpired(inviteCode.expiresAt) && (
                          <Badge variant="destructive" className="glass-soft border-border/30 shadow-sm">Expired</Badge>
                        )}
                        {isAtLimit(inviteCode) && (
                          <Badge variant="secondary" className="glass-soft border-border/30 shadow-sm">At Limit</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInviteCode(inviteCode);
                            setIsViewDialogOpen(true);
                          }}
                          className="hover:bg-primary/10 transition-colors duration-200 rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(inviteCode.joinUrl)}
                          className="hover:bg-primary/10 transition-colors duration-200 rounded-full"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleInviteCodeStatus(inviteCode.id)}
                          title={inviteCode.isActive ?"Deactivate" :"Activate"}
                          className="hover:bg-primary/10 transition-colors duration-200 rounded-full"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInviteCodeToDelete(inviteCode.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invite Code Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedInviteCode && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedInviteCode.name}</DialogTitle>
                <DialogDescription>
                  Invite code details and sharing options
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Invite Code</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={selectedInviteCode.code} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedInviteCode.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Join URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={selectedInviteCode.joinUrl} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedInviteCode.joinUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedInviteCode.qrCodeDataUrl && (
                  <div className="space-y-2">
                    <Label>QR Code</Label>
                    <div className="flex justify-center p-4 border rounded">
                      <Image 
                        src={selectedInviteCode.qrCodeDataUrl} 
                        alt="QR Code"
                        width={128}
                        height={128}
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Membership Type</Label>
                    <p>{selectedInviteCode.membershipTypeName}</p>
                  </div>
                  <div>
                    <Label>Usage</Label>
                    <p>
                      {selectedInviteCode.currentUses}
                      {selectedInviteCode.maxUses && ` / ${selectedInviteCode.maxUses}`}
                    </p>
                  </div>
                  <div>
                    <Label>Expires</Label>
                    <p>{formatDate(selectedInviteCode.expiresAt)}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p>{selectedInviteCode.isActive ?'Active' :'Inactive'}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invite Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invite code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteInviteCode}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 