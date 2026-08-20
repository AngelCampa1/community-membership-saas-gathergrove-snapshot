'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { eventPaymentAdminService } from '@/services/eventPaymentAdminService';
import { EventPaymentOverview, EventAttendeePaymentInfo } from '@/types/eventPayment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefundDialog } from './RefundDialog';
import { ManualPaymentDialog } from './ManualPaymentDialog';
import { useToast } from '@/hooks/useToast';
import { Download, DollarSign, Users, Search } from 'lucide-react';

export function EventPaymentManagement() {
  const params = useParams();
  const clubId = Number(params?.clubId);
  const eventId = Number(params?.eventId);
  const toast = useToast();

  const [overview, setOverview] = useState<EventPaymentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<EventAttendeePaymentInfo | null>(null);

  useEffect(() => {
    loadPaymentOverview();
  }, [clubId, eventId]);

  const loadPaymentOverview = async () => {
    try {
      setLoading(true);
      const data = await eventPaymentAdminService.getPaymentOverview(clubId, eventId);
      setOverview(data);
    } catch {
      toast.error('Failed to load payment overview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await eventPaymentAdminService.exportPaymentData(clubId, eventId, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payment data exported successfully');
    } catch {
      toast.error('Failed to export payment data');
    }
  };

  const handleRefundClick = (attendee: EventAttendeePaymentInfo) => {
    setSelectedAttendee(attendee);
    setRefundDialogOpen(true);
  };

  const handleRefundSuccess = () => {
    setRefundDialogOpen(false);
    setSelectedAttendee(null);
    loadPaymentOverview();
  };

  const handleManualPaymentSuccess = () => {
    setManualPaymentDialogOpen(false);
    loadPaymentOverview();
  };

  const filteredAttendees = overview?.attendees.filter((attendee) => {
    const matchesSearch =
      (attendee.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (attendee.paymentStatus ?? '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  const getPaymentStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'succeeded') {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    } else if (statusLower === 'failed') {
      return <Badge className="bg-destructive text-destructive-foreground">Failed</Badge>;
    } else if (statusLower === 'refunded') {
      return <Badge className="bg-muted text-muted-foreground">Refunded</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading payment overview...</div>;
  }

  if (!overview) {
    return <div className="flex justify-center p-8">No payment data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalAttendees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">{overview.paymentSummary.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium">{overview.paymentSummary.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed:</span>
                <span className="font-medium">{overview.paymentSummary.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refunded:</span>
                <span className="font-medium">{overview.paymentSummary.refunded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual:</span>
                <span className="font-medium">{overview.paymentSummary.manualPayments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>View and manage event payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setManualPaymentDialogOpen(true)} variant="outline">
                Record Manual Payment
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Member Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No attendees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.rsvpId}>
                      <TableCell className="font-medium">{attendee.name}</TableCell>
                      <TableCell>{attendee.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{attendee.memberStatus}</Badge>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(attendee.paymentStatus)}</TableCell>
                      <TableCell>
                        {attendee.amountPaid
                          ? `$${attendee.amountPaid.toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendee.paymentDate
                          ? new Date(attendee.paymentDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{attendee.paymentMethod || '-'}</TableCell>
                      <TableCell>
                        {attendee.canRefund && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRefundClick(attendee)}
                          >
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedAttendee && (
        <RefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          attendee={selectedAttendee}
          clubId={clubId}
          eventId={eventId}
          onSuccess={handleRefundSuccess}
        />
      )}

      <ManualPaymentDialog
        open={manualPaymentDialogOpen}
        onOpenChange={setManualPaymentDialogOpen}
        clubId={clubId}
        eventId={eventId}
        onSuccess={handleManualPaymentSuccess}
      />
    </div>
  );
}

