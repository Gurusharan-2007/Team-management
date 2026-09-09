"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  X,
  Zap,
  Trash2,
} from "lucide-react";
import { MemberListItem, UserRole, UserStatus, ALL_ROLES, ROLE_LABELS } from "@/types/domain";
import { isLeadership, isCaptain } from "@/lib/auth/permissions";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ManagePointsDialog } from "@/components/points/manage-points-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateMemberRoleAction,
  toggleMemberStatusAction,
  updateMemberInfoAction,
  deleteMemberAction,
} from "@/actions/members";
import { getInitials, formatPoints, cn } from "@/lib/utils";

interface TeamDirectoryProps {
  initialMembers: MemberListItem[];
  currentUserRole: UserRole;
  currentUserId: string;
}

type SortField = "name" | "activity_points" | "reward_points" | "courses";
type SortOrder = "asc" | "desc";

export function TeamDirectory({
  initialMembers,
  currentUserRole,
  currentUserId,
}: TeamDirectoryProps) {
  const [members, setMembers] = React.useState<MemberListItem[]>(initialMembers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortField, setSortField] = React.useState<SortField>("name");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc");

  // Dialog states for Captain / Vice Captain management
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<MemberListItem | null>(null);
  const [newRole, setNewRole] = React.useState<UserRole>("member");

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editAvatarUrl, setEditAvatarUrl] = React.useState("");

  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Status toggle confirmation modal
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<MemberListItem | null>(null);
  const [confirmNextStatus, setConfirmNextStatus] = React.useState<UserStatus | null>(null);

  // Member deletion confirmation modal (Captain only)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [memberToDelete, setMemberToDelete] = React.useState<MemberListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const canManage = isLeadership(currentUserRole);
  const canDelete = isCaptain(currentUserRole);

  // Sync state if initialMembers changes
  React.useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Filtering & Sorting
  const filteredMembers = React.useMemo(() => {
    return members
      .filter((member) => {
        const matchesSearch =
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole =
          roleFilter === "all" || member.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || member.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "name") {
          comparison = a.full_name.localeCompare(b.full_name);
        } else if (sortField === "activity_points") {
          comparison = (a.activity_points || 0) - (b.activity_points || 0);
        } else if (sortField === "reward_points") {
          comparison = (a.reward_points || 0) - (b.reward_points || 0);
        } else if (sortField === "courses") {
          comparison = (a.completed_courses_count || 0) - (b.completed_courses_count || 0);
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [members, searchQuery, roleFilter, statusFilter, sortField, sortOrder]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  const handleOpenRoleDialog = (member: MemberListItem) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setActionMessage(null);
    setRoleDialogOpen(true);
  };

  const handleOpenEditDialog = (member: MemberListItem) => {
    setSelectedMember(member);
    setEditName(member.full_name);
    setEditAvatarUrl(member.avatar_url || "");
    setActionMessage(null);
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    setActionMessage(null);

    const result = await updateMemberRoleAction({
      targetUserId: selectedMember.id,
      newRole,
    });

    setActionLoading(false);

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? { ...m, role: newRole } : m))
      );
      setActionMessage({ type: "success", text: `Role updated to ${ROLE_LABELS[newRole]}.` });
      setTimeout(() => setRoleDialogOpen(false), 900);
    } else {
      setActionMessage({ type: "error", text: result.error || "Failed to update role." });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    setActionMessage(null);

    const result = await updateMemberInfoAction({
      targetUserId: selectedMember.id,
      fullName: editName,
      avatarUrl: editAvatarUrl.trim() || null,
    });

    setActionLoading(false);

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? { ...m, full_name: editName, avatar_url: editAvatarUrl.trim() || null }
            : m
        )
      );
      setActionMessage({ type: "success", text: "Member details updated." });
      setTimeout(() => setEditDialogOpen(false), 900);
    } else {
      setActionMessage({ type: "error", text: result.error || "Failed to update member." });
    }
  };

  const handleToggleStatus = (member: MemberListItem) => {
    const nextStatus: UserStatus = member.status === "active" ? "inactive" : "active";
    setConfirmTarget(member);
    setConfirmNextStatus(nextStatus);
    setConfirmOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmTarget || !confirmNextStatus) return;
    setActionLoading(true);
    const result = await toggleMemberStatusAction({
      targetUserId: confirmTarget.id,
      status: confirmNextStatus,
    });
    setActionLoading(false);

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === confirmTarget.id ? { ...m, status: confirmNextStatus } : m))
      );
      setConfirmOpen(false);
      setConfirmTarget(null);
    } else {
      setConfirmOpen(false);
      setActionMessage({
        type: "error",
        text: result.error || "Failed to change member status.",
      });
    }
  };

  const handleDeleteClick = (member: MemberListItem) => {
    if (!canDelete || member.id === currentUserId) return;
    setActionMessage(null);
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      const result = await deleteMemberAction({
        targetUserId: memberToDelete.id,
      });

      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
        setDeleteDialogOpen(false);
        setActionMessage({
          type: "success",
          text: `Member "${memberToDelete.full_name}" has been removed from the team.`,
        });
        setMemberToDelete(null);
      } else {
        setDeleteDialogOpen(false);
        setActionMessage({
          type: "error",
          text: result.error || "Failed to remove member.",
        });
      }
    } catch {
      setDeleteDialogOpen(false);
      setActionMessage({
        type: "error",
        text: "An unexpected error occurred while removing the member.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderSortHeader = (label: string, field: SortField, align: "left" | "right" | "center" = "left") => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSortToggle(field)}
        className={cn(
          "inline-flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider transition-colors hover:text-foreground",
          isActive ? "text-foreground font-bold" : "text-muted-foreground",
          align === "right" && "justify-end",
          align === "center" && "justify-center"
        )}
      >
        <span>{label}</span>
        {isActive ? (
          sortOrder === "asc" ? (
            <ChevronUp className="h-3 w-3 text-primary" />
          ) : (
            <ChevronDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Sort Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[110px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sorting Dropdown */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(val) => {
              const [field, order] = val.split("-") as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 opacity-60" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="activity_points-desc">Activity Points (High)</SelectItem>
              <SelectItem value="activity_points-asc">Activity Points (Low)</SelectItem>
              <SelectItem value="reward_points-desc">Reward Points (High)</SelectItem>
              <SelectItem value="reward_points-asc">Reward Points (Low)</SelectItem>
              <SelectItem value="courses-desc">Courses Completed (High)</SelectItem>
              <SelectItem value="courses-asc">Courses Completed (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Roster View */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No members match your criteria"
          description="Try adjusting your search query, role filter, or status filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          }
          className="py-12"
        />
      ) : (
        <div className="rounded-2xl border border-border/60 glass-panel overflow-hidden shadow-glass">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 backdrop-blur-xs">
                  <th className="py-3 px-4">
                    {renderSortHeader("Member", "name", "left")}
                  </th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Role
                  </th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-right">
                    {renderSortHeader("Activity Pts", "activity_points", "right")}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {renderSortHeader("Reward Pts", "reward_points", "right")}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {renderSortHeader("Courses", "courses", "center")}
                  </th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${member.id}`} tabIndex={-1}>
                          <Avatar className="h-8 w-8 border border-border shrink-0 hover:opacity-80 transition-opacity">
                            {member.avatar_url && (
                              <AvatarImage src={member.avatar_url} alt={member.full_name} />
                            )}
                            <AvatarFallback className="text-[11px] font-semibold">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="space-y-0.5 overflow-hidden">
                          <Link
                            href={`/profile/${member.id}`}
                            className="font-medium text-foreground hover:underline truncate block"
                          >
                            {member.full_name}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono truncate block">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RoleBadge role={member.role} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      {member.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground font-medium">
                      {formatPoints(member.activity_points || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground font-medium">
                      {formatPoints(member.reward_points || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="subtle" className="text-[10px] font-mono">
                        {member.completed_courses_count || 0}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View Profile"
                        >
                          <Link href={`/profile/${member.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>

                        {canManage && (
                          <>
                            <ManagePointsDialog
                              targetMemberId={member.id}
                              targetMemberName={member.full_name}
                              currentActivityPoints={member.activity_points || 0}
                              currentRewardPoints={member.reward_points || 0}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Manage Points"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenRoleDialog(member)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Change Role"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(member)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit Details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(member)}
                              className={member.status === "active" ? "h-7 w-7 text-muted-foreground hover:text-destructive" : "h-7 w-7 text-muted-foreground hover:text-emerald-500"}
                              title={member.status === "active" ? "Deactivate member" : "Reactivate member"}
                            >
                              {member.status === "active" ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            {canDelete && member.id !== currentUserId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(member)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                title={`Remove ${member.full_name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card / List View */}
          <div className="divide-y divide-border md:hidden">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-border shrink-0">
                      {member.avatar_url && (
                        <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      )}
                      <AvatarFallback className="text-[11px] font-semibold">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <Link
                        href={`/profile/${member.id}`}
                        className="font-medium text-xs text-foreground truncate block hover:underline"
                      >
                        {member.full_name}
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-mono truncate block">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <RoleBadge role={member.role} size="sm" />
                    {member.status === "active" ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Active" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" title="Inactive" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs border-t border-border/40">
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span>
                      <strong className="text-foreground">{formatPoints(member.activity_points || 0)}</strong>
                      <span className="text-muted-foreground ml-1">act</span>
                    </span>
                    <span>
                      <strong className="text-foreground">{formatPoints(member.reward_points || 0)}</strong>
                      <span className="text-muted-foreground ml-1">rew</span>
                    </span>
                    <span>
                      <strong className="text-foreground">{member.completed_courses_count || 0}</strong>
                      <span className="text-muted-foreground ml-1">courses</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-7 w-7 text-muted-foreground"
                    >
                      <Link href={`/profile/${member.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {canManage && (
                      <>
                        <ManagePointsDialog
                          targetMemberId={member.id}
                          targetMemberName={member.full_name}
                          currentActivityPoints={member.activity_points || 0}
                          currentRewardPoints={member.reward_points || 0}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              title="Manage Points"
                            >
                              <Zap className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenRoleDialog(member)}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(member)}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(member)}
                          className={member.status === "active" ? "h-7 w-7 text-muted-foreground hover:text-destructive" : "h-7 w-7 text-muted-foreground hover:text-emerald-500"}
                        >
                          {member.status === "active" ? (
                            <UserX className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {canDelete && member.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(member)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title={`Remove ${member.full_name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Organization Role</DialogTitle>
            <DialogDescription>
              Modify role for {selectedMember?.full_name} ({selectedMember?.email}). Role permissions are strictly enforced at the database and server level.
            </DialogDescription>
          </DialogHeader>

          {actionMessage && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-xs ${
                actionMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">Select New Role</label>
            <Select value={newRole} onValueChange={(val: UserRole) => setNewRole(val)}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="text-xs">
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Role Capabilities Summary:</p>
              <p>• Captain: Full system administration, role assignment, points, and audits.</p>
              <p>• Vice Captain: Operational team &amp; point management, role delegation.</p>
              <p>• Manager: Read-only access to team reports, individual stats &amp; rosters.</p>
              <p>• Strategist: Performance trends, reports &amp; member directory insights.</p>
              <p>• Member: Access to team reports, personal milestones, own profile only.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRole}
              loading={actionLoading}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Info Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Information</DialogTitle>
            <DialogDescription>
              Update profile details for {selectedMember?.email}.
            </DialogDescription>
          </DialogHeader>

          {actionMessage && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-xs ${
                actionMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label htmlFor="editName" className="text-xs font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="editAvatar" className="text-xs font-medium text-foreground">
                Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="editAvatar"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              loading={actionLoading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Member Deactivation / Reactivation */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmNextStatus === "inactive" ? "Deactivate Team Member" : "Reactivate Team Member"}
        description={
          confirmNextStatus === "inactive"
            ? `Are you sure you want to deactivate ${confirmTarget?.full_name}? They will lose active team permissions, but all historical weekly reports, point ledgers, and course completions will remain permanently preserved.`
            : `Are you sure you want to reactivate ${confirmTarget?.full_name}? They will regain full member access and participate in weekly reporting cycles.`
        }
        confirmLabel={confirmNextStatus === "inactive" ? "Deactivate Member" : "Reactivate Member"}
        isDestructive={confirmNextStatus === "inactive"}
        isLoading={actionLoading}
        onConfirm={handleConfirmToggleStatus}
      />

      {/* Confirmation Dialog for Permanent Member Removal (Captain only) */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Team Member"
        description={
          memberToDelete
            ? `Are you sure you want to permanently remove ${memberToDelete.full_name} (${memberToDelete.email}) from the team? This action cannot be undone and will delete their membership from the workspace.`
            : "Are you sure you want to remove this member from the team?"
        }
        confirmLabel="Remove Member"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
