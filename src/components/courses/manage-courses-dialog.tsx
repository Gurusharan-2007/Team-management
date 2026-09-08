"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Course } from "@/types/domain";
import { toggleCourseCompletionAction } from "@/actions/courses";

interface ManageCoursesDialogProps {
  targetMemberId: string;
  targetMemberName: string;
  allCourses: Course[];
  initialCompletedCourseIds: string[];
  trigger?: React.ReactNode;
}

export function ManageCoursesDialog({
  targetMemberId,
  targetMemberName,
  allCourses,
  initialCompletedCourseIds,
  trigger,
}: ManageCoursesDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(
    new Set(initialCompletedCourseIds)
  );
  const [pendingCourseId, setPendingCourseId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync state when props change
  React.useEffect(() => {
    setCompletedIds(new Set(initialCompletedCourseIds));
  }, [initialCompletedCourseIds]);

  const filteredCourses = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCourses.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      // Show all active courses, plus archived courses if already completed
      const isCompleted = completedIds.has(c.id);
      return matchesQuery && (c.status === "active" || isCompleted);
    });
  }, [allCourses, searchQuery, completedIds]);

  const handleToggle = async (courseId: string) => {
    const currentlyCompleted = completedIds.has(courseId);
    const nextCompleted = !currentlyCompleted;

    setPendingCourseId(courseId);
    setErrorMessage(null);

    // Optimistic update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (nextCompleted) {
        next.add(courseId);
      } else {
        next.delete(courseId);
      }
      return next;
    });

    const result = await toggleCourseCompletionAction({
      targetMemberId,
      courseId,
      completed: nextCompleted,
    });

    setPendingCourseId(null);

    if (!result.success) {
      // Rollback
      setCompletedIds((prev) => {
        const rollback = new Set(prev);
        if (currentlyCompleted) {
          rollback.add(courseId);
        } else {
          rollback.delete(courseId);
        }
        return rollback;
      });
      setErrorMessage(result.error || "Failed to update course completion status.");
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setErrorMessage(null);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-xs">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Manage Courses
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Technical Courses</span>
            <Badge variant="subtle" className="font-mono text-xs">
              {completedIds.size} Completed
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Select the technical courses completed by {targetMemberName}. Course completions are recorded without completion dates per team policy.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search course title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        {/* Course List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/60 rounded-md border border-border/70 p-1">
          {filteredCourses.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching courses found.
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isCompleted = completedIds.has(course.id);
              const isPending = pendingCourseId === course.id;

              return (
                <div
                  key={course.id}
                  onClick={() => !isPending && handleToggle(course.id)}
                  className={`flex items-start gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${
                    isCompleted
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                  role="checkbox"
                  aria-checked={isCompleted}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      if (!isPending) handleToggle(course.id);
                    }
                  }}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    ) : isCompleted ? (
                      <Check className="h-3 w-3 stroke-[3]" />
                    ) : null}
                  </div>

                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground leading-none">
                        {course.name}
                      </span>
                      {course.status === "archived" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <p className="text-[11px] text-muted-foreground">
            Changes save automatically.
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleClose(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
