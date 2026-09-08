"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookPlus,
  Edit2,
  Archive,
  ArchiveRestore,
  Plus,
  CheckCircle2,
  AlertCircle,
  Settings2,
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
import { Course, CourseStatus } from "@/types/domain";
import {
  createCourseAction,
  updateCourseAction,
  toggleCourseStatusAction,
} from "@/actions/courses";

interface CourseCatalogManagerProps {
  courses: Course[];
  trigger?: React.ReactNode;
}

export function CourseCatalogManager({
  courses: initialCourses,
  trigger,
}: CourseCatalogManagerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [courses, setCourses] = React.useState<Course[]>(initialCourses);

  // Form mode: "list" | "create" | "edit"
  const [viewMode, setViewMode] = React.useState<"list" | "create" | "edit">("list");
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);

  const [courseName, setCourseName] = React.useState("");
  const [courseDescription, setCourseDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const resetForm = () => {
    setViewMode("list");
    setSelectedCourse(null);
    setCourseName("");
    setCourseDescription("");
    setMessage(null);
  };

  const handleOpenCreate = () => {
    setSelectedCourse(null);
    setCourseName("");
    setCourseDescription("");
    setMessage(null);
    setViewMode("create");
  };

  const handleOpenEdit = (course: Course) => {
    setSelectedCourse(course);
    setCourseName(course.name);
    setCourseDescription(course.description || "");
    setMessage(null);
    setViewMode("edit");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createCourseAction({
      name: courseName,
      description: courseDescription,
    });

    setLoading(false);

    if (result.success && result.course) {
      setCourses((prev) => [...prev, result.course as Course]);
      setMessage({ type: "success", text: "Course added to catalog." });
      setTimeout(() => {
        resetForm();
        router.refresh();
      }, 700);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to create course." });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setLoading(true);
    setMessage(null);

    const result = await updateCourseAction({
      courseId: selectedCourse.id,
      name: courseName,
      description: courseDescription,
    });

    setLoading(false);

    if (result.success) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourse.id
            ? { ...c, name: courseName.trim(), description: courseDescription.trim() || null }
            : c
        )
      );
      setMessage({ type: "success", text: "Course details updated." });
      setTimeout(() => {
        resetForm();
        router.refresh();
      }, 700);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update course." });
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus: CourseStatus = course.status === "active" ? "archived" : "active";
    setLoading(true);

    const result = await toggleCourseStatusAction({
      courseId: course.id,
      status: nextStatus,
    });

    setLoading(false);

    if (result.success) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
      );
      router.refresh();
    } else {
      alert(result.error || "Failed to toggle status.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-xs">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Manage Catalog
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Course Catalog Administration</span>
            {viewMode === "list" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={handleOpenCreate}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Course
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Configure technical courses available to college team members.
          </DialogDescription>
        </DialogHeader>

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

        {viewMode === "list" ? (
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60 rounded-md border border-border/70 p-1">
            {courses.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No courses in catalog. Click "Add Course" above.
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 p-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {course.name}
                      </span>
                      <Badge
                        variant={course.status === "active" ? "default" : "outline"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {course.status === "active" ? "Active" : "Archived"}
                      </Badge>
                    </div>
                    {course.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(course)}
                      title="Edit Course"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleStatus(course)}
                      title={course.status === "active" ? "Archive course" : "Reactivate course"}
                    >
                      {course.status === "active" ? (
                        <Archive className="h-3.5 w-3.5" />
                      ) : (
                        <ArchiveRestore className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form
            onSubmit={viewMode === "create" ? handleCreateSubmit : handleUpdateSubmit}
            className="space-y-4 py-1"
          >
            <div className="space-y-1.5">
              <label htmlFor="course-name" className="text-xs font-medium text-foreground">
                Course Title
              </label>
              <Input
                id="course-name"
                placeholder="e.g. Distributed Systems Architecture"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="course-desc" className="text-xs font-medium text-foreground">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="course-desc"
                placeholder="Brief summary of syllabus or skills covered"
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={loading}>
                {viewMode === "create" ? "Add Course" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
