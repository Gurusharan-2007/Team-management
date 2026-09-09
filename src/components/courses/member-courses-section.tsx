"use client";

import * as React from "react";
import { BookOpen, Check, Settings2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Course } from "@/types/domain";
import { ManageCoursesDialog } from "./manage-courses-dialog";
import { CourseCatalogManager } from "./course-catalog-manager";

interface MemberCoursesSectionProps {
  targetMemberId: string;
  targetMemberName: string;
  completedCourses: { id: string; name: string; description: string | null }[];
  allCourses: Course[];
  canEditCourses: boolean;
  canManageCatalog?: boolean;
}

export function MemberCoursesSection({
  targetMemberId,
  targetMemberName,
  completedCourses,
  allCourses,
  canEditCourses,
  canManageCatalog = false,
}: MemberCoursesSectionProps) {
  const completedIds = React.useMemo(
    () => completedCourses.map((c) => c.id),
    [completedCourses]
  );

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">
              Completed Technical Courses
            </CardTitle>
            <Badge variant="subtle" className="text-xs font-mono">
              {completedCourses.length} Completed
            </Badge>
          </div>
          <CardDescription>
            Technical proficiency and certifications recorded in the team catalog.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canManageCatalog && (
            <CourseCatalogManager courses={allCourses} />
          )}

          {canEditCourses && (
            <ManageCoursesDialog
              targetMemberId={targetMemberId}
              targetMemberName={targetMemberName}
              allCourses={allCourses}
              initialCompletedCourseIds={completedIds}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {completedCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            badgeText="Technical Certifications"
            title="No Courses Completed Yet"
            description="Completed technical courses will be displayed here without completion dates per team policy."
            action={
              canEditCourses ? (
                <ManageCoursesDialog
                  targetMemberId={targetMemberId}
                  targetMemberName={targetMemberName}
                  allCourses={allCourses}
                  initialCompletedCourseIds={completedIds}
                  trigger={
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Select Completed Courses
                    </Button>
                  }
                />
              ) : undefined
            }
            className="py-8 border-dashed"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="group relative rounded-xl border border-border/70 bg-card/60 p-3.5 transition-all duration-200 hover:border-border hover:shadow-xs space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {course.name}
                  </h4>
                </div>

                {course.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 pl-6">
                    {course.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
