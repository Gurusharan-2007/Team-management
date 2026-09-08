"use client";

import * as React from "react";
import { Profile, TeamSettings } from "@/types/domain";
import { AccountSettingsForm } from "./account-settings-form";
import { TeamSettingsForm } from "./team-settings-form";
import { WeeklyReportSettings } from "./weekly-report-settings";
import { ExportDataCard } from "./export-data-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  User,
  Sliders,
  CalendarCheck,
  Download,
  Shield,
  Moon,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface SettingsPortalProps {
  profile: Profile;
  settings: TeamSettings;
  hasLeadership: boolean;
}

type SettingsTab = "account" | "team" | "automations" | "export" | "security";

export function SettingsPortal({
  profile,
  settings,
  hasLeadership,
}: SettingsPortalProps) {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("account");

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "account", label: "My Account", icon: User },
    ...(hasLeadership
      ? [
          { id: "team" as SettingsTab, label: "Team Workspace", icon: Sliders, adminOnly: true },
          { id: "automations" as SettingsTab, label: "Automations", icon: CalendarCheck, adminOnly: true },
          { id: "export" as SettingsTab, label: "Data Export", icon: Download, adminOnly: true },
        ]
      : []),
    { id: "security", label: "Permissions & Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/70 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.adminOnly && (
                <span className="text-[10px] opacity-80 uppercase tracking-wider font-bold">
                  (Admin)
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {activeTab === "account" && (
          <div className="space-y-6">
            <AccountSettingsForm profile={profile} />

            {/* Appearance Option in Account */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base font-semibold">Theme & Appearance</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Choose between light and dark visual presentation modes.
                    </CardDescription>
                  </div>
                  <ThemeToggle />
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "team" && hasLeadership && (
          <TeamSettingsForm initialSettings={settings} />
        )}

        {activeTab === "automations" && hasLeadership && (
          <WeeklyReportSettings initialSettings={settings} />
        )}

        {activeTab === "export" && hasLeadership && (
          <ExportDataCard />
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <Card className="border shadow-xs">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Security Architecture & Role Permissions</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Role-based access control and database-level security guarantees enforced across the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border bg-card/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Captain</span>
                      <Badge className="text-[10px]">Highest Authority</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Full workspace administration, role assignments, point adjustments, audit logs, team settings, and data exports.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Vice Captain</span>
                      <Badge variant="secondary" className="text-[10px]">Operational Leadership</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Operational parity with Captain for daily management, point modifications, and audit logs.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Manager</span>
                      <Badge variant="outline" className="text-[10px]">Coordination & Reports</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      View all member profiles, inspect individual and team weekly reports, track team activity timeline. Cannot alter points.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Strategist</span>
                      <Badge variant="outline" className="text-[10px]">Analytics & Strategy</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Deep analytics access, historical snapshots, member progress inspection, and team activity timeline. Cannot alter points.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card/60 space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Member</span>
                      <Badge variant="subtle" className="text-[10px]">Team Contributor</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      View own profile, view public team directory and leaderboards, submit weekly updates, track completed courses. Admin settings and organization audit logs are blocked.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Active Invariant Guarantees</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Last Captain Protection:</strong> The database prevents demoting or deactivating the final active Captain via Postgres triggers.
                    </li>
                    <li>
                      <strong className="text-foreground">Strict Member Isolation:</strong> Notifications and personal credentials are protected by Supabase Row-Level Security (RLS).
                    </li>
                    <li>
                      <strong className="text-foreground">Audit Traceability:</strong> Sensitive operations (role changes, point edits, data exports) create irreversible audit log records.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
