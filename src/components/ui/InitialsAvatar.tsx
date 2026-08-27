import React from "react";
import { cn } from "@/utils/cn";

interface InitialsAvatarProps {
  name: string;
  className?: string;
  onClick?: () => void;
  imageUrl?: string;
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, className, onClick, imageUrl }) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "??";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full font-bold select-none text-center leading-none overflow-hidden",
        !imageUrl && "bg-gradient-to-br from-orange-50 to-orange-100 text-[#ff5623] border border-orange-200/40 font-sans shadow-inner",
        className
      )}
      style={{ containerType: "size" }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: "clamp(9px, 36cqmin, 22px)" }}>{getInitials(name)}</span>
      )}
    </div>
  );
};
