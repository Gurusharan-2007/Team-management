"use client";

import React, { useState } from "react";
import { Achievement } from "@/types/domain";
import { AchievementIcon } from "./achievement-icon";
import { AchievementDialog } from "./achievement-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleAchievementStatusAction } from "@/actions/achievements";
import { Plus, Edit2, ShieldAlert, Sparkles, Check, X } from "lucide-react";

interface AchievementAdminSectionProps {
  achievements: Achievement[];
  onRefresh?: () => void;
}

export function AchievementAdminSection({
  achievements,
  onRefresh,
}: AchievementAdminSectionProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (ach: Achievement) => {
    setTogglingId(ach.id);
    try {
      await toggleAchievementStatusAction(ach.id, !ach.active);
      onRefresh?.();
    } catch (err) {
      console.error("Failed to toggle achievement status:", err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Milestone Configurations
          </h3>
          <p className="text-xs text-muted-foreground">
            Captain & Vice Captain administrative controls. Achievements are awarded automatically via system events; arbitrary manual awards are strictly disabled.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedAchievement(null);
            setDialogOpen(true);
          }}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Milestone</span>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {achievements.map((ach) => (
                <tr key={ach.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-muted border border-border">
                        <AchievementIcon name={ach.icon} className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{ach.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {ach.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="font-mono">{ach.achievement_type}</span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                    {ach.threshold.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {ach.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAchievement(ach);
                          setDialogOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit milestone definition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(ach)}
                        disabled={togglingId === ach.id}
                        className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                          ach.active
                            ? "hover:bg-destructive/10 hover:text-destructive border-border"
                            : "hover:bg-emerald-500/10 hover:text-emerald-500 border-border"
                        }`}
                      >
                        {ach.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AchievementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        achievement={selectedAchievement}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
}
