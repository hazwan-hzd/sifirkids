import React from "react";
import { ChildAvatar } from "@/lib/types";
import { AVATAR_ITEMS } from "@/lib/avatarItems";

export interface AvatarRendererProps {
  avatar?: ChildAvatar;
  skin?: string;
  hairStyle?: string;
  hairColor?: string;
  eyes?: string;
  top?: string;
  topColor?: string;
  dress?: string;
  dressColor?: string;
  bottom?: string;
  bottomColor?: string;
  accessory?: string;
  accessoryColor?: string;
  background?: string;
  size?: number;
  className?: string;
}

const gradients: Record<string, string> = {
  "bg-sunny": "url(#bg-sunny-grad)",
  "bg-sky": "url(#bg-sky-grad)",
  "bg-grape": "url(#bg-grape-grad)",
  "bg-teal": "url(#bg-teal-grad)",
  "bg-coral": "url(#bg-coral-grad)",
  "bg-rainbow": "url(#bg-rainbow-grad)",
  "bg-space": "url(#bg-space-grad)",
};

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatar,
  skin,
  hairStyle,
  hairColor,
  eyes,
  top,
  topColor,
  dress,
  dressColor,
  bottom,
  bottomColor,
  accessory,
  accessoryColor,
  background,
  size = 100,
  className = "",
}) => {
  // Resolve active option values, falling back to avatar object, then defaults
  const skinVal = skin || avatar?.skin || "skin-fair";
  const hairStyleVal = hairStyle || avatar?.hairStyle || "hair-short";
  const hairColorVal = hairColor || avatar?.hairColor || "#54301a";
  const eyesVal = eyes || avatar?.eyes || "eyes-cute";
  const topVal = top || avatar?.top || "top-tshirt";
  const topColorVal = topColor || avatar?.topColor || "#1f9bff";
  const dressVal = dress || avatar?.dress || "dress-none";
  const dressColorVal = dressColor || avatar?.dressColor || "#ff85a2";
  const bottomVal = bottom || avatar?.bottom || "bottom-none";
  const bottomColorVal = bottomColor || avatar?.bottomColor || "#343a40";
  const accessoryVal = accessory || avatar?.accessory || "acc-none";
  const accessoryColorVal = accessoryColor || avatar?.accessoryColor || "#ffd700";
  const backgroundVal = background || avatar?.background || "bg-white";

  // Resolve skin HEX color
  const skinItem = AVATAR_ITEMS.skin.find((i) => i.id === skinVal);
  const skinColor = skinItem?.value || skinVal || "#ffe0bd";

  // Resolve background fill
  const getBgFill = (bgId: string) => {
    if (gradients[bgId]) return gradients[bgId];
    const item = AVATAR_ITEMS.background.find((i) => i.id === bgId);
    if (item) {
      if (item.value?.startsWith("linear-gradient")) {
        return gradients[item.id] || "#ffffff";
      }
      return item.value || "#ffffff";
    }
    return bgId.startsWith("#") ? bgId : "#ffffff";
  };

  const bgFill = getBgFill(backgroundVal);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`select-none rounded-[2rem] shadow-soft ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sunny Yellow Gradient */}
        <linearGradient id="bg-sunny-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff2cc" />
          <stop offset="100%" stopColor="#ffba00" />
        </linearGradient>

        {/* Sky Blue Gradient */}
        <linearGradient id="bg-sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9eeff" />
          <stop offset="100%" stopColor="#1f9bff" />
        </linearGradient>

        {/* Grape Purple Gradient */}
        <linearGradient id="bg-grape-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ece0ff" />
          <stop offset="100%" stopColor="#8b4dff" />
        </linearGradient>

        {/* Teal Mint Gradient */}
        <linearGradient id="bg-teal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4f5ef" />
          <stop offset="100%" stopColor="#14c2a0" />
        </linearGradient>

        {/* Coral Peach Gradient */}
        <linearGradient id="bg-coral-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe3e0" />
          <stop offset="100%" stopColor="#ff5a47" />
        </linearGradient>

        {/* Magical Rainbow Gradient */}
        <linearGradient id="bg-rainbow-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7a6b" />
          <stop offset="25%" stopColor="#ffba00" />
          <stop offset="50%" stopColor="#7ed957" />
          <stop offset="75%" stopColor="#1f9bff" />
          <stop offset="100%" stopColor="#a06bff" />
        </linearGradient>

        {/* Deep Space Gradient */}
        <linearGradient id="bg-space-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#100a26" />
          <stop offset="100%" stopColor="#2c2140" />
        </linearGradient>
      </defs>

      {/* Layer 1: Background */}
      <rect width="200" height="200" rx="40" fill={bgFill} />

      {/* Deep Space Stars decoration */}
      {backgroundVal === "bg-space" && (
        <g fill="#ffffff" opacity="0.6">
          <circle cx="30" cy="40" r="1.5" />
          <circle cx="160" cy="50" r="1" />
          <circle cx="170" cy="120" r="1.5" />
          <circle cx="45" cy="140" r="1" />
          <circle cx="90" cy="30" r="1" />
          <path d="M 120 40 L 122 43 L 125 43 L 123 45 L 124 48 L 120 46 L 116 48 L 117 45 L 115 43 L 118 43 Z" />
          <path d="M 50 80 L 51 82 L 53 82 L 52 83 L 53 85 L 50 84 L 47 85 L 48 83 L 47 82 L 49 82 Z" />
        </g>
      )}

      {/* Layer 2: Hair Back */}
      {hairStyleVal === "hair-long" && (
        <path
          d="M 52 90 C 45 120, 48 160, 52 165 C 56 170, 70 160, 80 150 L 120 150 C 130 160, 144 170, 148 165 C 152 160, 155 120, 148 90 Z"
          fill={hairColorVal}
        />
      )}
      {hairStyleVal === "hair-curly" && (
        <g fill={hairColorVal}>
          <circle cx="50" cy="95" r="18" />
          <circle cx="52" cy="115" r="16" />
          <circle cx="150" cy="95" r="18" />
          <circle cx="148" cy="115" r="16" />
        </g>
      )}
      {hairStyleVal === "hair-pigtails" && (
        <g fill={hairColorVal}>
          <circle cx="45" cy="75" r="16" stroke="#1a1a1a" strokeWidth="1.5" />
          <circle cx="155" cy="75" r="16" stroke="#1a1a1a" strokeWidth="1.5" />
          {/* Pigtail hair ties */}
          <ellipse cx="53" cy="82" rx="4" ry="2" fill="#ec4899" />
          <ellipse cx="147" cy="82" rx="4" ry="2" fill="#ec4899" />
        </g>
      )}
      {hairStyleVal === "hair-pinkie" && (
        <g fill={hairColorVal}>
          <circle cx="42" cy="80" r="22" />
          <circle cx="45" cy="105" r="22" />
          <circle cx="48" cy="125" r="18" />
          <circle cx="158" cy="80" r="22" />
          <circle cx="155" cy="105" r="22" />
          <circle cx="152" cy="125" r="18" />
        </g>
      )}

      {/* Layer 3: Body & Shoulders Base */}
      <path
        d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
        fill={skinColor}
      />

      {/* Layer 4: Clothing (Dress or Top) */}
      {dressVal !== "dress-none" ? (
        // Render dress options
        <>
          {dressVal === "dress-summer" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill={dressColorVal}
              />
              <path
                d="M 80 128 L 85 145 M 120 128 L 115 145"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <path
                d="M 82 148 C 90 158, 110 158, 118 148 Z"
                fill={skinColor}
              />
              <path
                d="M 82 148 C 90 158, 110 158, 118 148"
                stroke="#000000"
                strokeWidth="1.5"
                opacity="0.15"
                fill="none"
              />
            </g>
          )}
          {dressVal === "dress-apron" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill={dressColorVal}
              />
              <path
                d="M 75 148 L 125 148 L 130 200 L 70 200 Z"
                fill="#ffffff"
              />
              <path
                d="M 75 148 L 65 132 M 125 148 L 135 132"
                stroke="#ffffff"
                strokeWidth="4.5"
              />
              <circle cx="100" cy="170" r="4" fill={dressColorVal} />
            </g>
          )}
          {dressVal === "dress-dungarees" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill="#3b82f6"
              />
              {/* Shirt underneath */}
              <path
                d="M 75 128 L 100 148 L 125 128 L 120 140 L 80 140 Z"
                fill={topColorVal}
              />
              {/* Straps */}
              <path
                d="M 75 148 L 68 132"
                stroke="#1d4ed8"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 125 148 L 132 132"
                stroke="#1d4ed8"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <rect x="85" y="160" width="30" height="25" rx="3" fill="#1d4ed8" />
              {/* Pocket emblem */}
              <circle cx="100" cy="172" r="3" fill="#ffd700" />
            </g>
          )}
          {dressVal === "dress-superhero" && (
            <g>
              {/* Cape */}
              <path
                d="M 45 148 L 20 200 L 180 200 L 155 148 Z"
                fill="#ef4444"
              />
              {/* Suit */}
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill={dressColorVal}
              />
              {/* Star Logo */}
              <path
                d="M 100 152 L 103 162 L 112 162 L 105 168 L 107 178 L 100 172 L 93 178 L 95 168 L 88 162 L 97 162 Z"
                fill="#fbbf24"
              />
            </g>
          )}
          {dressVal === "dress-tulle-skirt" && (
            <g>
              {/* Top body part (shirt) */}
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 150 165 L 50 165 Z"
                fill={topColorVal}
              />
              {/* Tulle Skirt */}
              <path
                d="M 42 165 C 38 180, 50 200, 100 200 C 150 200, 162 180, 158 165 Z"
                fill="#ff85a2"
              />
              <path
                d="M 38 175 C 34 185, 50 200, 100 200 C 150 200, 166 185, 162 175 Z"
                fill="#ffb3d9"
                opacity="0.6"
              />
              <path
                d="M 45 185 C 40 192, 60 200, 100 200 C 140 200, 160 192, 155 185 Z"
                fill="#ffffff"
                opacity="0.4"
              />
              {/* Belt */}
              <rect x="48" y="162" width="104" height="6" rx="3" fill="#ff5d8f" />
            </g>
          )}
          {dressVal === "dress-kimono" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill={dressColorVal}
              />
              <rect
                x="52"
                y="165"
                width="96"
                height="15"
                fill="#fbbf24"
                stroke="#d97706"
                strokeWidth="1"
              />
              <rect x="85" y="162" width="30" height="21" fill="#ef4444" rx="2" />
              <path
                d="M 85 128 L 100 165 L 115 128"
                stroke="#ffffff"
                strokeWidth="3"
                fill="none"
              />
            </g>
          )}
          {dressVal === "dress-princess" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 158 200 L 42 200 Z"
                fill={dressColorVal}
              />
              <circle cx="52" cy="142" r="12" fill="#ffffff" opacity="0.9" />
              <circle cx="148" cy="142" r="12" fill="#ffffff" opacity="0.9" />
              <circle cx="100" cy="155" r="3" fill="#fbbf24" />
              <circle cx="85" cy="170" r="2.5" fill="#e0f2fe" />
              <circle cx="115" cy="170" r="2.5" fill="#e0f2fe" />
            </g>
          )}
        </>
      ) : (
        // Render top/shirt options
        <>
          {topVal === "top-tshirt" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill={topColorVal}
              />
              <path
                d="M 82 128 C 90 138, 110 138, 118 128 Z"
                fill={skinColor}
              />
              <path
                d="M 82 128 C 90 138, 110 138, 118 128"
                stroke="#000000"
                strokeWidth="1.5"
                opacity="0.1"
                fill="none"
              />
            </g>
          )}
          {topVal === "top-sweater" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill={topColorVal}
              />
              <path
                d="M 80 128 C 88 135, 112 135, 120 128"
                stroke={topColorVal}
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 80 128 C 88 135, 112 135, 120 128"
                stroke="#000000"
                strokeWidth="1.5"
                opacity="0.15"
                fill="none"
              />
              <path
                d="M 90 150 L 90 190 M 100 150 L 100 190 M 110 150 L 110 190"
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.25"
                strokeLinecap="round"
                strokeDasharray="3 3"
              />
            </g>
          )}
          {topVal === "top-tank" && (
            <g>
              <path
                d="M 64 148 L 136 148 L 142 200 L 58 200 Z"
                fill={topColorVal}
              />
              <path
                d="M 72 132 L 72 148 M 128 132 L 128 148"
                stroke={topColorVal}
                strokeWidth="8"
              />
            </g>
          )}
          {topVal === "top-hoodie" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill={topColorVal}
              />
              <path
                d="M 72 128 C 72 128, 85 148, 100 148 C 115 148, 128 128, 128 128 C 138 135, 125 156, 100 156 C 75 156, 62 135, 72 128 Z"
                fill={topColorVal}
                stroke="#000000"
                strokeWidth="1"
                strokeOpacity="0.1"
              />
              <path
                d="M 75 170 L 125 170 L 130 195 L 70 195 Z"
                fill="#000000"
                opacity="0.06"
              />
              <line
                x1="94"
                y1="148"
                x2="94"
                y2="165"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="106"
                y1="148"
                x2="106"
                y2="168"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="94" cy="166" r="2" fill="#ffffff" />
              <circle cx="106" cy="169" r="2" fill="#ffffff" />
            </g>
          )}
          {topVal === "top-jacket" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill="#f3f4f6"
              />
              <path
                d="M 85 128 C 90 142, 110 142, 115 128 Z"
                fill={skinColor}
              />
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 130 200 L 120 148 L 100 162 L 80 148 L 70 200 L 45 200 Z"
                fill="#3b82f6"
              />
              <path
                d="M 50 148 L 72 148 L 76 185 L 68 185 Z"
                fill="#2563eb"
              />
              <path
                d="M 150 148 L 128 148 L 124 185 L 132 185 Z"
                fill="#2563eb"
              />
              <line
                x1="100"
                y1="165"
                x2="100"
                y2="200"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </g>
          )}
          {topVal === "top-jersey" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill={topColorVal}
              />
              <path
                d="M 58 135 L 52 160 M 66 138 L 60 163"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 142 135 L 148 160 M 134 138 L 140 163"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 82 128 C 90 138, 110 138, 118 128 Z"
                fill="#ffffff"
              />
              <path
                d="M 85 128 C 90 134, 110 134, 115 128 Z"
                fill={skinColor}
              />
              <text
                x="100"
                y="178"
                fontFamily="var(--font-display)"
                fontSize="18"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                10
              </text>
            </g>
          )}
          {topVal === "top-roblox-hoodie" && (
            <g>
              <path
                d="M 50 148 C 50 128, 150 128, 150 148 L 155 200 L 45 200 Z"
                fill="#2d3035"
              />
              <rect x="75" y="152" width="50" height="28" rx="4" fill="#ef4444" />
              <g transform="translate(100, 166) rotate(15)">
                <rect x="-8" y="-8" width="16" height="16" fill="#ffffff" />
                <rect x="-3" y="-3" width="6" height="6" fill="#ef4444" />
              </g>
              <path
                d="M 72 128 C 72 128, 85 146, 100 146 C 115 146, 128 128, 128 128 C 136 134, 122 152, 100 152 C 78 152, 64 134, 72 128 Z"
                fill="#4a4e54"
              />
              <line
                x1="93"
                y1="145"
                x2="93"
                y2="158"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="107"
                y1="145"
                x2="107"
                y2="158"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}
        </>
      )}

      {/* Layer 5: Bottom clothing if dress is none */}
      {dressVal === "dress-none" && bottomVal !== "bottom-none" && (
        <rect x="52" y="195" width="96" height="5" fill={bottomColorVal} />
      )}

      {/* Layer 6: Neck Shadow & Head Base */}
      <rect x="90" y="125" width="20" height="20" rx="4" fill={skinColor} />
      <rect x="90" y="125" width="20" height="20" rx="4" fill="#000000" opacity="0.08" />

      {/* Ears */}
      <circle cx="55" cy="92" r="10" fill={skinColor} />
      <circle cx="55" cy="92" r="6" fill="#ff7a6b" opacity="0.2" />
      <circle cx="145" cy="92" r="10" fill={skinColor} />
      <circle cx="145" cy="92" r="6" fill="#ff7a6b" opacity="0.2" />

      {/* Head */}
      <ellipse cx="100" cy="90" rx="42" ry="45" fill={skinColor} />

      {/* Layer 7: Face Details (Eyes & Smile) */}
      {/* Eyes Layer (Unless blindfolded) */}
      {accessoryVal !== "acc-gojo" && (
        <>
          {eyesVal === "eyes-cute" && (
            <g>
              <circle cx="82" cy="90" r="8" fill="#1a1a1a" />
              <circle cx="80" cy="88" r="2.5" fill="#ffffff" />
              <circle cx="84" cy="92" r="1" fill="#ffffff" />
              <circle cx="118" cy="90" r="8" fill="#1a1a1a" />
              <circle cx="116" cy="88" r="2.5" fill="#ffffff" />
              <circle cx="120" cy="92" r="1" fill="#ffffff" />
            </g>
          )}
          {eyesVal === "eyes-happy" && (
            <g>
              <path
                d="M 74 92 Q 82 84 90 92"
                stroke="#1a1a1a"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 110 92 Q 118 84 126 92"
                stroke="#1a1a1a"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}
          {eyesVal === "eyes-kawaii" && (
            <g>
              <ellipse cx="82" cy="90" rx="8" ry="11" fill="#1a1a1a" />
              <circle cx="80" cy="86" r="3" fill="#ffffff" />
              <circle cx="84" cy="93" r="1.5" fill="#ffffff" />
              <circle cx="79" cy="92" r="1" fill="#ffffff" />
              <ellipse cx="118" cy="90" rx="8" ry="11" fill="#1a1a1a" />
              <circle cx="116" cy="86" r="3" fill="#ffffff" />
              <circle cx="120" cy="93" r="1.5" fill="#ffffff" />
              <circle cx="115" cy="92" r="1" fill="#ffffff" />
            </g>
          )}
          {eyesVal === "eyes-winking" && (
            <g>
              <path
                d="M 74 90 Q 82 96 90 90"
                stroke="#1a1a1a"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="118" cy="90" r="8" fill="#1a1a1a" />
              <circle cx="116" cy="88" r="2.5" fill="#ffffff" />
              <circle cx="120" cy="92" r="1" fill="#ffffff" />
            </g>
          )}
          {eyesVal === "eyes-sparkle" && (
            <g>
              <path
                d="M 82 78 L 84 85 L 91 85 L 86 89 L 88 96 L 82 92 L 76 96 L 78 89 L 73 85 L 80 85 Z"
                fill="#ffba00"
                stroke="#1a1a1a"
                strokeWidth="1.5"
              />
              <path
                d="M 118 78 L 120 85 L 127 85 L 122 89 L 124 96 L 118 92 L 112 96 L 114 89 L 109 85 L 116 85 Z"
                fill="#ffba00"
                stroke="#1a1a1a"
                strokeWidth="1.5"
              />
            </g>
          )}
          {eyesVal === "eyes-nerd" && (
            <g>
              <circle cx="82" cy="90" r="5" fill="#1a1a1a" />
              <circle cx="81" cy="89" r="1.5" fill="#ffffff" />
              <circle cx="118" cy="90" r="5" fill="#1a1a1a" />
              <circle cx="117" cy="89" r="1.5" fill="#ffffff" />
              <circle
                cx="82"
                cy="90"
                r="14"
                stroke="#1a1a1a"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="118"
                cy="90"
                r="14"
                stroke="#1a1a1a"
                strokeWidth="3"
                fill="none"
              />
              <line x1="96" y1="90" x2="104" y2="90" stroke="#1a1a1a" strokeWidth="3" />
              <line x1="56" y1="90" x2="68" y2="90" stroke="#1a1a1a" strokeWidth="3" />
              <line
                x1="132"
                y1="90"
                x2="144"
                y2="90"
                stroke="#1a1a1a"
                strokeWidth="3"
              />
            </g>
          )}
          {eyesVal === "eyes-cool" && (
            <g>
              <path
                d="M 64 82 L 94 82 L 90 98 C 80 102, 70 102, 66 98 Z"
                fill="#1a1a1a"
              />
              <path d="M 68 84 L 88 84 L 86 90 Z" fill="#ffffff" opacity="0.3" />
              <path
                d="M 106 82 L 136 82 L 134 98 C 130 102, 120 102, 110 98 Z"
                fill="#1a1a1a"
              />
              <path
                d="M 110 84 L 130 84 L 128 90 Z"
                fill="#ffffff"
                opacity="0.3"
              />
              <rect x="94" y="85" width="12" height="4" fill="#1a1a1a" />
            </g>
          )}
        </>
      )}

      {/* Cheeks */}
      <circle cx="70" cy="108" r="5" fill="#ff5a47" opacity="0.3" />
      <circle cx="130" cy="108" r="5" fill="#ff5a47" opacity="0.3" />

      {/* Smile */}
      <path
        d="M 92 108 Q 100 118 108 108"
        stroke="#1a1a1a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Layer 8: Hair Front */}
      {hairStyleVal === "hair-short" && (
        <g>
          <path
            d="M 58 72 C 60 55, 140 55, 142 72 C 142 72, 130 65, 115 70 C 105 74, 95 72, 85 68 C 75 65, 58 72, 58 72 Z"
            fill={hairColorVal}
          />
          <path d="M 58 70 L 58 90 L 64 80 Z" fill={hairColorVal} />
          <path d="M 142 70 L 142 90 L 136 80 Z" fill={hairColorVal} />
        </g>
      )}
      {hairStyleVal === "hair-long" && (
        <g>
          <path
            d="M 58 70 C 65 52, 135 52, 142 70 C 142 70, 125 58, 100 65 C 75 58, 58 70, 58 70 Z"
            fill={hairColorVal}
          />
          <path
            d="M 58 70 C 58 70, 56 95, 62 110 C 64 115, 68 110, 68 110 C 68 110, 62 90, 64 72 Z"
            fill={hairColorVal}
          />
          <path
            d="M 142 70 C 142 70, 144 95, 138 110 C 136 115, 132 110, 132 110 C 132 110, 138 90, 136 72 Z"
            fill={hairColorVal}
          />
        </g>
      )}
      {hairStyleVal === "hair-curly" && (
        <path
          d="M 58 72 C 55 60, 68 50, 80 55 C 88 50, 100 48, 108 53 C 118 48, 132 50, 138 60 C 145 68, 142 80, 135 82 C 130 82, 120 70, 100 75 C 80 70, 70 82, 65 82 C 58 80, 56 75, 58 72 Z"
          fill={hairColorVal}
        />
      )}
      {hairStyleVal === "hair-pigtails" && (
        <g>
          <path
            d="M 58 70 C 65 52, 135 52, 142 70 C 142 70, 128 60, 110 65 C 100 68, 90 64, 82 60 C 72 58, 58 70, 58 70 Z"
            fill={hairColorVal}
          />
          <path d="M 58 70 L 58 85 L 63 78 Z" fill={hairColorVal} />
          <path d="M 142 70 L 142 85 L 137 78 Z" fill={hairColorVal} />
        </g>
      )}
      {hairStyleVal === "hair-cool-sweep" && (
        <g>
          <path
            d="M 58 70 C 60 50, 140 50, 142 70 C 130 55, 90 52, 70 85 C 68 88, 62 82, 64 72 Z"
            fill={hairColorVal}
          />
          <path d="M 142 70 L 142 85 L 136 78 Z" fill={hairColorVal} />
          <path d="M 58 70 L 58 82 L 62 76 Z" fill={hairColorVal} />
        </g>
      )}
      {hairStyleVal === "hair-spiky" && (
        <g>
          {/* Spikes */}
          <path
            d="M 54 75 L 42 62 L 58 64 L 52 45 L 72 52 L 78 30 L 92 45 L 100 24 L 108 45 L 122 30 L 128 52 L 148 45 L 142 64 L 158 62 L 146 75 Z"
            fill={hairColorVal}
          />
          <path
            d="M 58 70 L 72 82 L 78 72 L 90 85 L 96 70 L 108 85 L 114 72 L 128 82 L 142 70 C 135 60, 65 60, 58 70 Z"
            fill={hairColorVal}
          />
        </g>
      )}
      {hairStyleVal === "hair-pinkie" && (
        <g>
          <path
            d="M 58 70 C 50 65, 52 50, 68 45 C 72 30, 95 32, 100 48 C 105 32, 128 30, 132 45 C 148 50, 150 65, 142 70 C 142 70, 135 60, 120 62 C 110 65, 90 65, 80 62 C 65 60, 58 70, 58 70 Z"
            fill={hairColorVal}
          />
          <circle cx="70" cy="55" r="14" fill={hairColorVal} />
          <circle cx="100" cy="50" r="16" fill={hairColorVal} />
          <circle cx="130" cy="55" r="14" fill={hairColorVal} />
          <circle cx="85" cy="62" r="10" fill={hairColorVal} />
          <circle cx="115" cy="62" r="10" fill={hairColorVal} />
        </g>
      )}

      {/* Layer 9: Accessory */}
      {accessoryVal === "acc-hairbow" && (
        <g transform="translate(125, 48) rotate(15)">
          <path
            d="M 0 0 C -15 -15, -20 10, 0 0 Z"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <path
            d="M 0 0 C 15 -15, 20 10, 0 0 Z"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2" />
          <path
            d="M -2 0 L -10 15 L -2 10 Z"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
          <path
            d="M 2 0 L 10 15 L 2 10 Z"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
        </g>
      )}
      {accessoryVal === "acc-anime-headband" && (
        <g>
          <path
            d="M 64 68 Q 100 60 136 68"
            stroke="#1e3a8a"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <rect
            x="85"
            y="58"
            width="30"
            height="12"
            rx="2"
            fill="#d1d5db"
            stroke="#374151"
            strokeWidth="1.5"
          />
          <path
            d="M 95 64 C 98 62, 102 62, 105 64 M 100 61 L 100 67"
            stroke="#374151"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="88" cy="64" r="1" fill="#374151" />
          <circle cx="112" cy="64" r="1" fill="#374151" />
        </g>
      )}
      {accessoryVal === "acc-headphones" && (
        <g>
          <path
            d="M 60 85 C 60 40, 140 40, 140 85"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
          />
          <path
            d="M 60 85 C 60 40, 140 40, 140 85"
            fill="none"
            stroke={accessoryColorVal}
            strokeWidth="2.5"
          />
          <rect
            x="46"
            y="80"
            width="10"
            height="24"
            rx="5"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <rect x="52" y="84" width="2" height="16" rx="1" fill="#ffffff" opacity="0.4" />
          <rect
            x="144"
            y="80"
            width="10"
            height="24"
            rx="5"
            fill={accessoryColorVal}
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <rect
            x="146"
            y="84"
            width="2"
            height="16"
            rx="1"
            fill="#ffffff"
            opacity="0.4"
          />
        </g>
      )}
      {accessoryVal === "acc-roblox-cap" && (
        <g transform="translate(100, 52)">
          <path
            d="M -40 10 C -40 -25, 40 -25, 40 10 Z"
            fill="#ef4444"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <path
            d="M -35 10 C -45 15, -10 22, 10 18"
            stroke="#1a1a1a"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M -35 10 C -45 15, -10 22, 10 18"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <g transform="translate(0, -2) rotate(15)">
            <rect x="-8" y="-8" width="16" height="16" fill="#ffffff" />
            <rect x="-3" y="-3" width="6" height="6" fill="#ef4444" />
          </g>
        </g>
      )}
      {accessoryVal === "acc-gojo" && (
        <g>
          <path
            d="M 52 82 C 52 82, 100 78, 148 82 L 146 100 C 146 100, 100 106, 54 100 Z"
            fill="#1f2937"
            stroke="#111827"
            strokeWidth="1.5"
          />
          <path
            d="M 53 90 L 40 85 L 48 93 L 38 98 L 52 96"
            fill="#1f2937"
            stroke="#111827"
            strokeWidth="1.5"
          />
          <path d="M 70 88 Q 100 84 130 88" stroke="#4b5563" strokeWidth="1.5" fill="none" />
          <path d="M 68 94 Q 100 91 132 94" stroke="#4b5563" strokeWidth="1.5" fill="none" />
        </g>
      )}
      {accessoryVal === "acc-star-mic" && (
        <g>
          <path
            d="M 145 92 C 142 80, 134 85, 138 98 C 142 105, 148 100, 148 95"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="2.5"
          />
          <path
            d="M 140 98 Q 130 112 110 110"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="108" cy="110" r="3.5" fill="#ec4899" />
          <circle cx="108" cy="110" r="1.5" fill="#ffffff" />
        </g>
      )}
      {accessoryVal === "acc-unicorn" && (
        <g>
          <ellipse
            cx="100"
            cy="35"
            rx="15"
            ry="30"
            fill="#fbcfe8"
            opacity="0.3"
          />
          <path d="M 94 52 L 100 15 L 106 52 Z" fill="#fbcfe8" stroke="#1a1a1a" strokeWidth="2" />
          <path
            d="M 95 44 C 98 42, 102 42, 105 44"
            stroke="#ec4899"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 97 34 C 99 32, 101 32, 103 34"
            stroke="#ec4899"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 98 24 C 99 22, 101 22, 102 24"
            stroke="#ec4899"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
      {accessoryVal === "acc-crown" && (
        <g transform="translate(100, 52)">
          <path
            d="M -25 0 L -30 -18 L -15 -8 L 0 -22 L 15 -8 L 30 -18 L 25 0 Z"
            fill="#ffd700"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="-24" y="-3" width="48" height="3" fill="#ffffff" opacity="0.5" />
          <circle cx="0" cy="-22" r="3" fill="#ef4444" stroke="#1a1a1a" strokeWidth="1" />
          <circle
            cx="-30"
            cy="-18"
            r="2.5"
            fill="#3b82f6"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
          <circle
            cx="30"
            cy="-18"
            r="2.5"
            fill="#3b82f6"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
          <circle cx="-10" cy="-5" r="2" fill="#ef4444" />
          <circle cx="10" cy="-5" r="2" fill="#10b981" />
        </g>
      )}
    </svg>
  );
};
