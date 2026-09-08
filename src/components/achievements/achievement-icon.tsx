import React from "react";
import {
  Award,
  Zap,
  Trophy,
  Gift,
  BookOpen,
  GraduationCap,
  Target,
  CalendarCheck,
  TrendingUp,
  Star,
  Shield,
  Flame,
  LucideProps,
} from "lucide-react";

interface AchievementIconProps extends LucideProps {
  name: string;
}

export const AVAILABLE_ACHIEVEMENT_ICONS = [
  { id: "award", label: "Award", icon: Award },
  { id: "trophy", label: "Trophy", icon: Trophy },
  { id: "zap", label: "Lightning (Activity)", icon: Zap },
  { id: "gift", label: "Gift (Reward)", icon: Gift },
  { id: "book-open", label: "Book Open", icon: BookOpen },
  { id: "graduation-cap", label: "Scholar", icon: GraduationCap },
  { id: "target", label: "Target (Goal)", icon: Target },
  { id: "calendar-check", label: "Calendar Check", icon: CalendarCheck },
  { id: "trending-up", label: "Trending Up", icon: TrendingUp },
  { id: "star", label: "Star", icon: Star },
  { id: "shield", label: "Shield", icon: Shield },
  { id: "flame", label: "Flame", icon: Flame },
];

export function AchievementIcon({ name, ...props }: AchievementIconProps) {
  switch (name?.toLowerCase()) {
    case "trophy":
      return <Trophy {...props} />;
    case "zap":
      return <Zap {...props} />;
    case "gift":
      return <Gift {...props} />;
    case "book-open":
      return <BookOpen {...props} />;
    case "graduation-cap":
      return <GraduationCap {...props} />;
    case "target":
      return <Target {...props} />;
    case "calendar-check":
      return <CalendarCheck {...props} />;
    case "trending-up":
      return <TrendingUp {...props} />;
    case "star":
      return <Star {...props} />;
    case "shield":
      return <Shield {...props} />;
    case "flame":
      return <Flame {...props} />;
    case "award":
    default:
      return <Award {...props} />;
  }
}
