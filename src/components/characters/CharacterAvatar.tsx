"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CharacterId, CharacterState } from "@/lib/types";

interface CharacterAvatarProps {
  who: CharacterId;
  state?: CharacterState;
  size?: number;
  className?: string;
  showHalo?: boolean;
}

const CHARACTER_NAME: Record<CharacterId, string> = {
  siraj: "سراج",
  omar: "عمر",
};

const STATE_RING: Record<CharacterState, string> = {
  neutral: "ring-primary-100",
  happy: "ring-primary-200",
  thinking: "ring-secondary-200",
  encouraging: "ring-primary-300",
  explaining: "ring-secondary-300",
};

const CHARACTER_BG: Record<CharacterId, string> = {
  siraj: "bg-primary-50",
  omar: "bg-secondary-50",
};

export function CharacterAvatar({
  who,
  state = "neutral",
  size = 36,
  className,
  showHalo = true,
}: CharacterAvatarProps) {
  const src = `/characters/${who}-base.png`;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        CHARACTER_BG[who],
        showHalo && `ring-2 ${STATE_RING[state]}`,
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`الشخصية: ${CHARACTER_NAME[who]} (${state})`}
    >
      <Image
        src={src}
        alt={CHARACTER_NAME[who]}
        width={size * 2}
        height={size * 2}
        className="h-full w-full object-cover"
        priority={false}
      />
    </div>
  );
}
