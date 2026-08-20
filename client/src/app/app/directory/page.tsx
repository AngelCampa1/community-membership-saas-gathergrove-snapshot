"use client";

import { useState, useEffect, useCallback } from"react";
import { useAuth } from"@/hooks/useAuth";
import { Card, CardContent } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Loader2, User, Mail, Phone, ArrowLeft, Search, Users, MapPin, Calendar, Shield } from"lucide-react";
import { useRouter } from"next/navigation";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { DirectoryService } from"@/services/directoryService";
import { PaginatedDirectoryMembersResponse } from"@/types/directoryMember";
import { logger } from"@/lib/logger";

export default function MemberDirectory() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [directoryData, setDirectoryData] = useState<PaginatedDirectoryMembersResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadMemberDirectory = useCallback(async () => {
    if (!user?.clubId) {
      setError("Unable to determine your club information");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await DirectoryService.getMemberDirectory(
        user.clubId,
        searchTerm || undefined,
        currentPage,
        25
      );
      setDirectoryData(result);
    } catch (error: unknown) {
      logger.error('members','Error loading member directory', { error, clubId: user.clubId, searchTerm, currentPage });
      const errorMessage = error instanceof Error ? error.message :"Failed to load member directory";
      setError(errorMessage);
      
      // Show appropriate error messages
      if (errorMessage.includes("disabled")) {
        toast.error("The member directory is currently disabled for your club.");
      } else if (errorMessage.includes("opt in")) {
        toast.error("You must opt in to the member directory to view other members.");
      } else {
        const apiError = ErrorHandler.handleApiError(error, { context:'loading member directory' });
        ErrorHandler.showErrorToast(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.clubId, searchTerm, currentPage]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Ensure only members and admins can access this page
      if (user.role !=="Member" && user.role !=="Admin") {
        toast.error("Access denied. This page is for club members and admins only.");
        router.push("/admin/dashboard");
        return;
      }
      
      loadMemberDirectory();
    }
  }, [user, loading, router, currentPage, searchTerm, loadMemberDirectory]);

  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setIsLoading(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">Loading member directory...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push(user?.role === "Admin" ? "/admin/dashboard" : "/app/dashboard")}
              className="mb-4 interactive-lift hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Member Directory</h1>
          </div>

          <Card className="glass-soft bg-destructive/5 border border-destructive/20 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 flex-shrink-0">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Directory Access Restricted</h3>
                  <p className="text-sm text-destructive/90 mt-1">
                    {error}
                  </p>
                  {error.includes("opt in") && (
                    <Button
                      className="mt-3 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                      onClick={() => router.push("/app/profile/directory-settings")}
                    >
                      Update Directory Settings
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const members = directoryData?.members || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/app/dashboard")}
            className="mb-4 interactive-lift hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Member Directory</h1>
          <p className="text-muted-foreground">
            Connect with other members of {user.clubName}
          </p>
      </div>

      {/* Search */}
      <Card className="mb-6 glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md bg-gradient-to-br from-primary/10 to-success/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Directory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-105 hover:shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-all duration-300">
                <Users className="h-4 w-4 text-primary group-hover:text-success transition-colors duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold group-hover:text-primary transition-colors duration-200">{directoryData?.totalMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Listed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-105 hover:shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20   group-hover:shadow-lg transition-all duration-300">
                <User className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold group-hover:text-primary transition-colors duration-200">{members.length}</p>
                <p className="text-xs text-muted-foreground">On This Page</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-105 hover:shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20   group-hover:shadow-lg transition-all duration-300">
                <Mail className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold group-hover:text-secondary transition-colors duration-200">{directoryData?.currentPage || 1}</p>
                <p className="text-xs text-muted-foreground">Page {directoryData?.currentPage} of {directoryData?.totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Notice */}
      <Card className="mb-6 glass-soft bg-primary/5 border border-primary/20 backdrop-blur-sm shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Directory Privacy</h3>
              <p className="text-sm text-primary/90 mt-1">
                The information shown in this directory is controlled by your club&apos;s privacy settings. 
                Members can choose what information to share. Only members who have opted in are listed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Members ({directoryData?.totalMembers || 0})</h2>
        </div>
        
        {members.length === 0 ? (
          <Card className="glass border-border/50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full glass-soft flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Members Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ?"No members match your search criteria." :"No members are listed in the directory."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id} className="glass border-border/50 hover:glass-strong transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full glass-soft flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{member.fullName}</h3>
                        
                        <div className="mt-2 space-y-1">
                          {member.email && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          
                          {member.phoneNumber && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{member.phoneNumber}</span>
                            </div>
                          )}
                          
                          {member.address && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{member.address}</span>
                            </div>
                          )}
                          
                          {member.membershipTypeName && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{member.membershipTypeName} Member</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {member.joinDate && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {directoryData && directoryData.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!directoryData.hasPreviousPage}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page {directoryData.currentPage} of {directoryData.totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!directoryData.hasNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
} 