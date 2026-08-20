'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import membershipTypeService from '@/services/membershipTypeService';
import { MembershipTypeResponse as MembershipType, CreateMembershipTypeRequest, UpdateMembershipTypeRequest } from '@/services/membershipTypeService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DUES_FREQUENCY_OPTIONS, DuesFrequency } from '@/constants/duesFrequency';
import { ErrorHandler } from '@/lib/errorHandler';

export default function MembershipTypesPage() {
  const { user } = useAuth();
  
  // State
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duesAmount: 0,
    duesFrequency: 'Monthly' as DuesFrequency
  });

  // Load membership types
  const loadMembershipTypes = useCallback(async () => {
    if (!user?.clubId) return;
    
    try {
      setLoading(true);
      const types = await membershipTypeService.getMembershipTypes(user.clubId);
      setMembershipTypes(types);
    } catch (error) {
      const apiError = ErrorHandler.handleMemberError(error, 'loading membership types');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    if (user?.clubId) {
      loadMembershipTypes();
    }
  }, [user?.clubId, loadMembershipTypes]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duesAmount: 0,
      duesFrequency: 'Monthly'
    });
  };

  // Handle create
  const handleCreate = async () => {
    if (!user?.clubId || !formData.name.trim()) return;

    try {
      setSubmitting(true);
      const request: CreateMembershipTypeRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duesAmount: formData.duesAmount,
        duesFrequency: formData.duesFrequency
      };

      await membershipTypeService.createMembershipType(user.clubId, request);
      toast.success('Membership type created successfully');
      
      setCreateDialogOpen(false);
      resetForm();
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'creating membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!user?.clubId || !selectedType || !formData.name.trim()) return;

    try {
      setSubmitting(true);
      const request: UpdateMembershipTypeRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duesAmount: formData.duesAmount,
        duesFrequency: formData.duesFrequency
      };

      await membershipTypeService.updateMembershipType(user.clubId, selectedType.id, request);
      toast.success('Membership type updated successfully');
      
      setEditDialogOpen(false);
      setSelectedType(null);
      resetForm();
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'updating membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user?.clubId || !selectedType) return;

    try {
      setSubmitting(true);
      await membershipTypeService.deleteMembershipType(user.clubId, selectedType.id);
      toast.success('Membership type deleted successfully');
      
      setDeleteDialogOpen(false);
      setSelectedType(null);
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'deleting membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog with selected type data
  const openEditDialog = (type: MembershipType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      duesAmount: type.duesAmount,
      duesFrequency: type.duesFrequency as DuesFrequency
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (type: MembershipType) => {
    setSelectedType(type);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading membership types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membership Types</h1>
          <p className="text-muted-foreground">Manage different membership categories and their dues</p>
        </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Membership Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Membership Type</DialogTitle>
                <DialogDescription>
                  Add a new membership type for your club members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Regular, Premium, Student"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description of this membership type"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="duesAmount">Dues Amount *</Label>
                  <Input
                    id="duesAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.duesAmount}
                    onChange={(e) => handleInputChange('duesAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duesFrequency">Dues Frequency *</Label>
                  <Select
                    value={formData.duesFrequency}
                    onValueChange={(value: DuesFrequency) => handleInputChange('duesFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DUES_FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={submitting || !formData.name.trim()}>
                    {submitting ? 'Creating...' : 'Create Membership Type'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {/* Membership Types Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {membershipTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {type.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {type.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(type)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(type)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Dues Amount:</span>
                    <span className="text-lg font-bold text-primary">${type.duesAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Frequency:</span>
                    <Badge variant="secondary">{type.duesFrequency}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Member Count:</span>
                    <span className="text-sm text-muted-foreground">{type.memberCount} members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {membershipTypes.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Membership Types</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    Create your first membership type to categorize club members and set dues amounts.
                  </p>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Membership Type
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Membership Type</DialogTitle>
              <DialogDescription>
                Update the membership type information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Regular, Premium, Student"
                />
              </div>
              
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description of this membership type"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="editDuesAmount">Dues Amount *</Label>
                <Input
                  id="editDuesAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.duesAmount}
                  onChange={(e) => handleInputChange('duesAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="editDuesFrequency">Dues Frequency *</Label>
                <Select
                  value={formData.duesFrequency}
                  onValueChange={(value) => handleInputChange('duesFrequency', value as DuesFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DUES_FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedType(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleEdit} disabled={submitting || !formData.name.trim()}>
                  {submitting ? 'Updating...' : 'Update Membership Type'}
                </Button>
              </div>
            </div>
          </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Membership Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the &ldquo;{selectedType?.name}&rdquo; membership type? 
                This action cannot be undone.
                {selectedType?.memberCount && selectedType.memberCount > 0 && (
                  <span className="block mt-2 text-sm text-destructive">
                    <strong>Warning:</strong> This membership type is currently assigned to {selectedType.memberCount} member(s).
                    You must reassign these members before deleting this type.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setSelectedType(null); }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 