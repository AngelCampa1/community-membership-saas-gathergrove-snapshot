"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  Mail,
  Trash,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";

interface ScheduledCommunication {
  id: number;
  type: "email";
  subject?: string;
  message: string;
  recipientCount: number;
  scheduledFor: string;
  status: "pending" | "sent" | "cancelled";
  createdAt: string;
}

export default function ScheduledCommunicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasUnlimitedTier } = useAuthorization();
  const toast = useToast();

  const [communications, setCommunications] = useState<ScheduledCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commToDelete, setCommToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.clubId) return;

    if (!hasUnlimitedTier()) {
      router.push("/admin/communications");
      return;
    }

    loadScheduledCommunications();
  }, [user?.clubId, hasUnlimitedTier, router]);

  const loadScheduledCommunications = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    try {
      // NOTE: Scheduled communications backend integration pending
      // When implementing:
      // 1. Create scheduledCommunicationsService with getScheduledCommunications(clubId)
      // 2. Consider extending scheduledReportsService or creating separate service
      // 3. Backend should return: { id, type, scheduledDate, recipients, status, content }
      // For now, using empty mock data
      const mockData: ScheduledCommunication[] = [];

      setCommunications(mockData);
    } catch (error) {
      logger.error('communications', 'Error loading scheduled communications', { error, clubId: user?.clubId });
      toast.error("Failed to load scheduled communications");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCommunication = async () => {
    if (!user?.clubId || !commToDelete) return;

    setDeleting(true);
    try {
      // NOTE: Cancel scheduled communication backend integration pending
      // When implementing:
      // await scheduledCommunicationsService.cancelScheduledCommunication(commToDelete)
      toast.success("Scheduled communication has been cancelled");

      setCommunications(communications.filter(c => c.id !== commToDelete));
      setDeleteDialogOpen(false);
      setCommToDelete(null);
    } catch (error) {
      logger.error('communications', 'Error cancelling communication', { error, commId: commToDelete, clubId: user?.clubId });
      toast.error("Failed to cancel communication");
    } finally {
      setDeleting(false);
    }
  };

  const confirmCancel = (commId: number) => {
    setCommToDelete(commId);
    setDeleteDialogOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (_type: string) => {
    return <Mail className="h-4 w-4" />;
  };

  if (!user?.clubId || !hasUnlimitedTier()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Communications</h1>
          <p className="text-muted-foreground">
            Manage communications scheduled for future delivery
          </p>
        </div>
        <Badge variant="secondary">Expand Feature</Badge>
      </div>

      {/* Communications Table */}
      <Card data-testid="card-scheduled-communications">
        <CardHeader>
          <CardTitle>Upcoming & Past Communications</CardTitle>
          <CardDescription>
            View and manage all scheduled communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" data-testid={`row-loading-${i}`} />
              ))}
            </div>
          ) : communications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" data-testid="empty-state">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled communications</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                You haven't scheduled any communications yet. Schedule email from the campaign builder.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/communications/new")}
                  data-testid="button-schedule-email"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Email
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject/Message</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications.map((comm) => (
                  <TableRow key={comm.id} data-testid={`row-comm-${comm.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.type)}
                        <span className="capitalize">{comm.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {comm.subject && (
                          <div className="font-medium">{comm.subject}</div>
                        )}
                        <div className="text-sm text-muted-foreground truncate">
                          {comm.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{comm.recipientCount} members</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDateTime(comm.scheduledFor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(comm.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {comm.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/communications/${comm.id}/edit`)}
                            data-testid={`button-edit-${comm.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmCancel(comm.id)}
                            data-testid={`button-cancel-${comm.id}`}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-cancel-communication">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Communication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled communication? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              data-testid="button-cancel-dialog"
            >
              Keep Scheduled
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelCommunication}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-cancel"
            >
              {deleting ? "Cancelling..." : "Cancel Communication"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

