"use client";

import * as React from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { UserRole, Profile } from "@/types/domain";
import {
  canManageMembers,
  canDeleteMember,
  canManagePoints,
  canManageRoles,
  canViewAllProfiles,
  canViewAllReports,
  canViewAuditLogs,
  canAccessAdminSettings,
} from "@/lib/auth/permissions";

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  canManageMembers: boolean;
  canDeleteMember: boolean;
  canManagePoints: boolean;
  canManageRoles: boolean;
  canViewAllProfiles: boolean;
  canViewAllReports: boolean;
  canViewAuditLogs: boolean;
  canAccessAdminSettings: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialRole?: UserRole;
  initialEmail?: string;
  initialName?: string;
}

export function AuthProvider({
  children,
  initialRole = "member",
  initialEmail = "member@college.edu",
  initialName = "Team Member",
}: AuthProviderProps) {
  const [user, setUser] = React.useState<{ id: string; email?: string } | null>({
    id: "initial-id",
    email: initialEmail,
  });
  const [profile, setProfile] = React.useState<Profile | null>({
    id: "initial-id",
    full_name: initialName,
    email: initialEmail,
    role: initialRole,
    status: "active",
    activity_points: 0,
    reward_points: 0,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [role, setRole] = React.useState<UserRole>(initialRole);
  const [loading, setLoading] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setRole("member");
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileData) {
        const p = profileData as Profile;
        setProfile(p);
        setRole(p.role as UserRole);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const value: AuthContextType = {
    user,
    profile,
    role,
    loading,
    canManageMembers: canManageMembers(role),
    canDeleteMember: canDeleteMember(role),
    canManagePoints: canManagePoints(role),
    canManageRoles: canManageRoles(role),
    canViewAllProfiles: canViewAllProfiles(role),
    canViewAllReports: canViewAllReports(role),
    canViewAuditLogs: canViewAuditLogs(role),
    canAccessAdminSettings: canAccessAdminSettings(role),
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within an AuthProvider");
  }
  return context;
}
