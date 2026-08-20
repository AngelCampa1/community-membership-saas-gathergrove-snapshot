'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import membershipTypeService, {
  CreateMembershipTypeRequest,
  UpdateMembershipTypeRequest,
  MembershipTypeResponse
} from '@/services/membershipTypeService';
import { DUES_FREQUENCY_OPTIONS } from '@/constants/duesFrequency';
import { ErrorHandler } from '@/lib/errorHandler';

export default function MembershipTypesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<MembershipTypeResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duesAmount: 0,
    duesFrequency: 'Monthly'
  });
  const [submitting, setSubmitting] = useState(false);

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
  }, [user, loadMembershipTypes]);

  const handleAdd = async () => {
    if (!user?.clubId) return;

    // Trim whitespace from all string inputs
    const trimmedData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      duesAmount: formData.duesAmount,
      duesFrequency: formData.duesFrequency
    };

    // Basic validation
    if (!trimmedData.name) {
      toast.error('Please enter a membership type name');
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateMembershipTypeRequest = {
        name: trimmedData.name,
        description: trimmedData.description,
        duesAmount: trimmedData.duesAmount,
        duesFrequency: trimmedData.duesFrequency
      };
      
      await membershipTypeService.createMembershipType(user.clubId, request);
      toast.success('Membership type created successfully');
      setAddDialogOpen(false);
      setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
      // Invalidate React Query cache so Add Member dialog gets fresh data
      queryClient.invalidateQueries({ queryKey: ['membershipTypes', user.clubId] });
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'creating membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!user?.clubId || !selectedType) return;

    try {
      setSubmitting(true);
      const request: UpdateMembershipTypeRequest = {
        name: formData.name,
        description: formData.description,
        duesAmount: formData.duesAmount,
        duesFrequency: formData.duesFrequency
      };
      
      await membershipTypeService.updateMembershipType(user.clubId, selectedType.id, request);
      toast.success('Membership type updated successfully');
      setEditDialogOpen(false);
      setSelectedType(null);
      setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
      // Invalidate React Query cache so Add Member dialog gets fresh data
      queryClient.invalidateQueries({ queryKey: ['membershipTypes', user.clubId] });
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'updating membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.clubId || !selectedType) return;

    try {
      setSubmitting(true);
      await membershipTypeService.deleteMembershipType(user.clubId, selectedType.id);
      toast.success('Membership type deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedType(null);
      // Invalidate React Query cache so Add Member dialog gets fresh data
      queryClient.invalidateQueries({ queryKey: ['membershipTypes', user.clubId] });
      await loadMembershipTypes();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'deleting membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (type: MembershipTypeResponse) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      duesAmount: type.duesAmount,
      duesFrequency: type.duesFrequency
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (type: MembershipTypeResponse) => {
    setSelectedType(type);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        
        {/* Loading State */}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="text-muted-foreground">Loading membership types...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="memberships-page">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Membership Types</h1>
          <p className="text-muted-foreground">
            Define membership categories and dues amounts for your club
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          if (!open && !submitting) {
            // Reset form when dialog closes
            setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
            setAddDialogOpen(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add New Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Membership Type</DialogTitle>
              <DialogDescription>
                Create a new membership type with its dues amount and frequency.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Type Name <span className="text-destructive">*</span></Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Family Membership"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-dues">Dues Amount <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="add-dues"
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999.99"
                    value={formData.duesAmount}
                    onChange={(e) => setFormData({ ...formData, duesAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="40.00"
                    className="pl-7"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dues Frequency <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.duesFrequency}
                  onValueChange={(value) => setFormData({ ...formData, duesFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
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
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
                setAddDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!formData.name || submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Membership Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Membership Types</CardTitle>
        </CardHeader>
        <CardContent>
          {membershipTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">No membership types defined yet</h3>
                  <p className="text-muted-foreground">
                    Get started by creating your first membership type
                  </p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Type
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Dues Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Dues Frequency</TableHead>
                    <TableHead className="hidden md:table-cell">Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membershipTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{type.name}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {formatCurrency(type.duesAmount)} • {type.duesFrequency} • {type.memberCount} members
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatCurrency(type.duesAmount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {type.duesFrequency}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {type.memberCount} members
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(type)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit {type.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(type)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {type.name}</span>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open && !submitting) {
          setEditDialogOpen(false);
          setSelectedType(null);
          setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Membership Type</DialogTitle>
            <DialogDescription>
              Update the membership type details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Type Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Family Membership"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dues">Dues Amount <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                  <Input
                    id="edit-dues"
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999.99"
                    value={formData.duesAmount}
                    onChange={(e) => setFormData({ ...formData, duesAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="40.00"
                    className="pl-7"
                    required
                  />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dues Frequency <span className="text-destructive">*</span></Label>
              <Select
                value={formData.duesFrequency}
                onValueChange={(value) => setFormData({ ...formData, duesFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
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
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setSelectedType(null);
              setFormData({ name: '', description: '', duesAmount: 0, duesFrequency: 'Monthly' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedType?.name}&rdquo;? This action cannot be undone.
              {selectedType?.memberCount && selectedType.memberCount > 0 && (
                <span className="block mt-2 text-sm text-destructive">
                  <strong>Warning:</strong> This membership type is currently assigned to {selectedType.memberCount} member(s).
                  You must reassign these members before deleting this type.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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