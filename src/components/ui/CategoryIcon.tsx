import {
  ShoppingBag,
  Wallet,
  Landmark,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Truck,
  Bus,
  Newspaper,
  Clapperboard,
  Wrench,
  Gamepad2,
  type LucideIcon,
  LayoutGrid,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ShoppingBag,
  Wallet,
  Landmark,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Truck,
  Bus,
  Newspaper,
  Clapperboard,
  Wrench,
  Gamepad2,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={2} />;
}
