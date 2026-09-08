"use client";

import * as React from "react";
import { Edit2, CheckCircle2, AlertCircle } from "lucide-react";
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
import { updateMemberInfoAction } from "@/actions/members";
import { useRouter } from "next/navigation";

interface EditProfileDialogProps {
  userId: string;
  initialName: string;
  initialAvatarUrl?: string | null;
}

export function EditProfileDialog({
  userId,
  initialName,
  initialAvatarUrl,
}: EditProfileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState(initialName);
  const [avatarUrl, setAvatarUrl] = React.useState(initialAvatarUrl || "");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateMemberInfoAction({
      targetUserId: userId,
      fullName,
      avatarUrl: avatarUrl.trim() || null,
    });

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 900);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public display name and avatar URL. Role and permissions are managed by leadership.
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
            <label htmlFor="name" className="text-xs font-medium text-foreground">
              Full Name
            </label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="avatar" className="text-xs font-medium text-foreground">
              Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="avatar"
              placeholder="https://images.unsplash.com/... or https://avatar.vercel.sh/..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
