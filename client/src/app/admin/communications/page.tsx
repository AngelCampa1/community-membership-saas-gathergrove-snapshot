"use client";

import { useState, useEffect, useCallback } from"react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { MessageSquare, Plus, Mail, Smartphone, User, Users, ChevronLeft, ChevronRight } from"lucide-react";
import Link from"next/link";
import { useAuth } from"@/hooks/useAuth";
import communicationService, {
  GetCommunicationHistoryResponse
} from"@/services/communicationService";
import { logger } from"@/lib/logger";

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<GetCommunicationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');

  const fetchHistory = useCallback(async (page: number = 1, type: string ='') => {
    if (!user?.clubId) return;
    
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: 10,
        ...(type && { communicationType: type })
      };
      const data = await communicationService.getCommunicationHistory(user.clubId, params);
      setHistoryData(data);
      setCurrentPage(page);
    } catch (error) {
      logger.error('communications','Error fetching communication history', { error, clubId: user?.clubId, page, type });
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    fetchHistory();
  }, [user?.clubId, fetchHistory]);

  const handleFilterChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
    fetchHistory(1, type);
  };

  const handlePageChange = (page: number) => {
    fetchHistory(page, selectedType);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case'email': return <Mail className="h-4 w-4" />;
      case'push': return <Smartphone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case'email': return'bg-primary/20 text-primary-foreground';
      case'push': return'bg-secondary/40 text-secondary-foreground';
      default: return'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case'sent': return'bg-success/20 text-success-foreground';
      case'failed': return'bg-destructive/20 text-destructive-foreground';
      case'pending': return'bg-warning/20 text-warning-foreground';
      default: return'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year:'numeric',
      month:'short',
      day:'numeric',
      hour:'2-digit',
      minute:'2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) +'...';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Communications
            </h1>
            <p className="text-muted-foreground mt-2">
              Send email and push updates to your club members
            </p>
          </div>
          <Link href="/admin/communications/new" data-testid="button-new-communication">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              New Communication
            </Button>
          </Link>
        </div>

        {/* Communication Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-105 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Email</span>
              </CardTitle>
              <CardDescription>
                Send newsletters and announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200" asChild>
                <Link href="/admin/communications/new?tab=email" data-testid="button-compose-email">
                  Compose Email
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-105 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/40 to-secondary/40">
                  <Smartphone className="h-5 w-5 text-secondary-foreground" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Push Notifications</span>
              </CardTitle>
              <CardDescription>
                Send notifications to mobile apps (Grow tier)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200" asChild>
                <Link href="/admin/communications/new?tab=push" data-testid="button-compose-push">
                  Send Push Notification
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Communication History */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              Communication History
            </CardTitle>
            <CardDescription>
              View and manage past communications sent to your members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedType ==='' ?'default' :'outline'}
                size="sm"
                onClick={() => handleFilterChange('')}
              >
                All
              </Button>
              <Button
                variant={selectedType ==='Email' ?'default' :'outline'}
                size="sm"
                onClick={() => handleFilterChange('Email')}
                className="flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
              <Button
                variant={selectedType ==='Push' ?'default' :'outline'}
                size="sm"
                onClick={() => handleFilterChange('Push')}
                className="flex items-center gap-1"
              >
                <Smartphone className="h-3 w-3" />
                Push
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading communication history...</p>
              </div>
            ) : historyData && historyData.communications.length > 0 ? (
              <>
                {/* Communication List */}
                <div className="space-y-4">
                  {historyData.communications.map((comm) => (
                    <div key={comm.id} className="glass-soft border-border/40 rounded-lg p-4 hover:glass transition-all duration-300 hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={`flex items-center gap-1 glass-soft shadow-sm ${getTypeColor(comm.communicationType)}`}>
                            {getTypeIcon(comm.communicationType)}
                            {comm.communicationType}
                          </Badge>
                          <Badge className={`glass-soft shadow-sm ${getStatusColor(comm.status)}`}>
                            {comm.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(comm.sentAt)}
                        </div>
                      </div>
                      
                      {comm.subject && (
                        <h4 className="font-medium text-foreground mb-2 truncate" title={comm.subject}>
                          {comm.subject}
                        </h4>
                      )}

                      <p className="text-muted-foreground mb-3 overflow-hidden text-ellipsis break-words">
                        {truncateText(comm.body, 150)}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {comm.sentByUserName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {comm.recipientCount} recipients
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {historyData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      <span className="hidden sm:inline">
                        Showing {((currentPage - 1) * historyData.pageSize) + 1} to{''}
                        {Math.min(currentPage * historyData.pageSize, historyData.totalCount)} of{''}
                        {historyData.totalCount} communications
                      </span>
                      <span className="sm:hidden">
                        Page {currentPage} / {historyData.totalPages}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!historyData.hasPreviousPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <span className="text-sm text-muted-foreground hidden md:inline">
                        Page {currentPage} of {historyData.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!historyData.hasNextPage}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-primary animate-bounce" style={{ animationDelay:'0.5s' }} />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  No communications found
                </h3>
                <div className="max-w-md mx-auto mb-8">
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    {selectedType 
                      ? `No ${selectedType.toLowerCase()} communications have been sent yet. Start engaging with your members through ${selectedType.toLowerCase()} messages.`
                      :"No communications have been sent yet. Start with email or push updates."
                    }
                  </p>
                  <div className="space-y-4">
                    <Link href="/admin/communications/new">
                      <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
                        <Plus className="h-5 w-5" />
                        Send First Communication
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Choose email or push alerts
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
