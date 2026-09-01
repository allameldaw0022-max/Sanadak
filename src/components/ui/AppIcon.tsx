import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-12 w-12 rounded-xl text-lg",
  md: "h-16 w-16 rounded-2xl text-2xl",
  lg: "h-20 w-20 rounded-2xl text-3xl sm:h-24 sm:w-24 sm:text-4xl",
};

const sizePx = { sm: 48, md: 64, lg: 96 };

export function AppIcon({
  name,
  color,
  iconUrl,
  size = "md",
  className,
}: {
  name: string;
  color: string;
  iconUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt={name}
        width={sizePx[size]}
        height={sizePx[size]}
        className={cn("shrink-0 object-cover shadow-sm", sizeClasses[size].replace(/text-\S+/, ""), className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-white shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </div>
  );
}
