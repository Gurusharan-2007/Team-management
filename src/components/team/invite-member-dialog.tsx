"use client";

import * as React from "react";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { UserRole, ALL_ROLES, ROLE_LABELS } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface InviteMemberDialogProps {
  canManage: boolean;
}

export function InviteMemberDialog({ canManage }: InviteMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("member");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!canManage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      // Insert profile pre-registration record
      const { error } = await (supabase.from("profiles") as any).insert({
        id: crypto.randomUUID(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: "active",
        activity_points: 0,
        reward_points: 0,
      });

      if (error) {
        // If unique email conflict or RLS error
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: `${fullName} has been added to the team roster as ${ROLE_LABELS[role]}.`,
        });
        setTimeout(() => {
          setOpen(false);
          setFullName("");
          setEmail("");
          setRole("member");
          router.refresh();
        }, 1200);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add member." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Register a member into the college team directory and assign their initial role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {message && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-xs ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="invName" className="text-xs font-medium text-foreground">
              Full Name
            </label>
            <Input
              id="invName"
              placeholder="e.g. Jordan Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invEmail" className="text-xs font-medium text-foreground">
              College or Personal Email
            </label>
            <Input
              id="invEmail"
              type="email"
              placeholder="jordan@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Assigned Role</label>
            <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              Save Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
