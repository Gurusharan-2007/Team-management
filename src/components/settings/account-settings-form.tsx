"use client";

import * as React from "react";
import { Profile } from "@/types/domain";
import { updatePersonalAccountAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/role-badge";
import { Loader2, CheckCircle2, ShieldAlert, Lock, User, Github, Linkedin, Mail } from "lucide-react";

interface AccountSettingsFormProps {
  profile: Profile;
}

export function AccountSettingsForm({ profile }: AccountSettingsFormProps) {
  const [fullName, setFullName] = React.useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url || "");
  const [bio, setBio] = React.useState(profile.bio || "");
  const [githubUsername, setGithubUsername] = React.useState(profile.github_username || "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(profile.linkedin_url || "");

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await updatePersonalAccountAction({
        fullName,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        githubUsername: githubUsername || null,
        linkedinUrl: linkedinUrl || null,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update profile." });
      } else {
        setFeedback({ type: "success", message: "Account profile updated successfully." });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">Personal Profile & Credentials</CardTitle>
        <CardDescription>
          Update your public profile info, avatar, bio, and engineering links visible across the team directory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {feedback && (
            <div
              className={`p-3.5 rounded-lg text-sm flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Account Identity Preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border bg-muted/20">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-xs">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="text-base font-bold">
                {getInitials(fullName || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-base text-foreground">{fullName || "Your Name"}</span>
                <RoleBadge role={profile.role} />
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground font-mono">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-muted-foreground pt-1">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span>Role changes must be granted by Captains in Team Directory. Self-escalation is prevented.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Avatar Image URL</label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                maxLength={500}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Engineering Bio / Focus Area</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. Autonomous systems, ROS 2 navigation, motor controller firmware..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              Brief summary of your specialization and current engineering responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-muted-foreground" />
                GitHub Username
              </label>
              <Input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g. rahul-verma"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                LinkedIn Profile URL
              </label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                maxLength={200}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Account Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
