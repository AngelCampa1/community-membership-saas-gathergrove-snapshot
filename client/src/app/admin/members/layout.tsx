"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FolderOpen, FileText, Settings, UserPlus, PieChart, Tag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Map paths to tab values
  const getTabValue = () => {
    if (pathname === "/admin/members") return "members";
    if (pathname === "/admin/members/types") return "types";
    if (pathname === "/admin/members/directory") return "directory";
    if (pathname === "/admin/members/custom-fields") return "custom-fields";
    if (pathname === "/admin/members/segments") return "segments";
    if (pathname === "/admin/members/tags") return "tags";
    if (pathname === "/admin/members/invite-codes") return "invite-codes";
    return "members";
  };

  const handleTabChange = (value: string) => {
    // Don't navigate if already on that tab
    if (getTabValue() === value) return;
    
    switch (value) {
      case "members":
        router.push("/admin/members");
        break;
      case "types":
        router.push("/admin/members/types");
        break;
      case "directory":
        router.push("/admin/members/directory");
        break;
      case "custom-fields":
        router.push("/admin/members/custom-fields");
        break;
      case "segments":
        router.push("/admin/members/segments");
        break;
      case "tags":
        router.push("/admin/members/tags");
        break;
      case "invite-codes":
        router.push("/admin/members/invite-codes");
        break;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Members
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your club members, directory settings, and custom fields
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={getTabValue()} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1">
            <TabsTrigger 
              value="members" 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Member List</span>
              <span className="sm:hidden">Members</span>
            </TabsTrigger>
            <TabsTrigger 
              value="types" 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Membership Types</span>
              <span className="sm:hidden">Types</span>
            </TabsTrigger>
            <TabsTrigger 
              value="invite-codes" 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Invite Codes</span>
              <span className="sm:hidden">Invites</span>
            </TabsTrigger>
            <TabsTrigger 
              value="directory" 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden md:inline">Directory Settings</span>
              <span className="md:hidden">Directory</span>
            </TabsTrigger>
            <TabsTrigger 
              value="custom-fields" 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden md:inline">Custom Fields</span>
              <span className="md:hidden">Fields</span>
            </TabsTrigger>
            <TabsTrigger
              value="segments"
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden md:inline">Segments</span>
              <span className="md:hidden">Segments</span>
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-background/80 hover:text-foreground transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            >
              <Tag className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden md:inline">Tags</span>
              <span className="md:hidden">Tags</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="mt-6">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  );
} 