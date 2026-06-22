"use client";

import { use, useEffect, useState, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import { CHILD_IDS, COLOR_CLASSES } from "@/lib/data";
import type { ChildId, ChildAvatar } from "@/lib/types";
import { useChild } from "@/lib/store";
import {
  PageShell,
  Loading,
  PointsBadge,
  BackButton,
  Card,
  Button,
  Confetti,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { AVATAR_ITEMS, AVATAR_COLORS, DEFAULT_AVATAR, type AvatarCategory, type AvatarItem } from "@/lib/avatarItems";
import { AvatarRenderer } from "@/components/AvatarRenderer";

const CATEGORY_TABS: { key: AvatarCategory; label: string; icon: string }[] = [
  { key: "skin", label: "Skin", icon: "🎨" },
  { key: "eyes", label: "Eyes", icon: "👁️" },
  { key: "hairStyle", label: "Hair", icon: "💇" },
  { key: "top", label: "Tops", icon: "👕" },
  { key: "dress", label: "Dresses", icon: "👗" },
  { key: "accessory", label: "Accessories", icon: "👑" },
  { key: "background", label: "Backgrounds", icon: "🏞️" },
];

export default function AvatarCustomizerPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;
  const router = useRouter();

  const { child, hydrated, saveAvatar, unlockAvatarItem } = useChild(id);

  // Character preview state (loaded from saved look or default)
  const [currentLook, setCurrentLook] = useState<ChildAvatar | null>(null);
  const [activeTab, setActiveTab] = useState<AvatarCategory>("skin");
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  // Sync saved look when store is hydrated
  useEffect(() => {
    if (hydrated && child) {
      if (child.avatar) {
        setCurrentLook(child.avatar);
      } else {
        // Fallback to default avatar
        setCurrentLook({
          ...DEFAULT_AVATAR,
          // Ensure skin matches the default profile color if possible, or just standard peach
          skin: "skin-fair",
          unlockedItems: [...DEFAULT_AVATAR.unlockedItems],
        });
      }
    }
  }, [hydrated, child]);

  if (!hydrated || !currentLook) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const c = COLOR_CLASSES[child.profile.color];
  const points = child.rewards.points;

  // Save outfit back to store
  function handleSave() {
    if (!currentLook) return;
    saveAvatar(currentLook);
    setToast("Outfit saved! Your new avatar is ready. 🎉");
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1500);
    window.setTimeout(() => {
      setToast(null);
      router.push(`/play/${id}`);
    }, 2000);
  }

  // Handle purchasing premium items
  function handlePurchase(item: AvatarItem) {
    if (points < item.cost) return;
    const ok = unlockAvatarItem(item.id, item.cost);
    if (ok) {
      setToast(`Unlocked ${item.name}! 🌟`);
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1500);
      window.setTimeout(() => setToast(null), 2500);
      
      // Update local unlockedItems list immediately so it renders equipped
      setCurrentLook((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          unlockedItems: [...prev.unlockedItems, item.id],
          [item.category]: item.id,
        };
      });
    }
  }

  // Equipping items (or triggering purchase)
  function handleItemClick(item: AvatarItem) {
    if (!currentLook) return;
    const isUnlocked = currentLook.unlockedItems.includes(item.id) || item.cost === 0;
    
    if (isUnlocked) {
      setCurrentLook((prev) => {
        if (!prev) return null;
        // If dressing up in a dress, set top to none to avoid overlap styling
        if (item.category === "dress" && item.id !== "dress-none") {
          return {
            ...prev,
            top: "top-none",
            dress: item.id,
          };
        }
        // If equipping a top, set dress to none
        if (item.category === "top" && item.id !== "top-none") {
          return {
            ...prev,
            dress: "dress-none",
            top: item.id,
          };
        }
        return {
          ...prev,
          [item.category]: item.id,
        };
      });
    }
  }

  function handleColorSelect(colorHex: string) {
    setCurrentLook((prev) => {
      if (!prev) return null;
      if (activeTab === "hairStyle") {
        return { ...prev, hairColor: colorHex };
      }
      if (activeTab === "top") {
        return { ...prev, topColor: colorHex };
      }
      if (activeTab === "dress") {
        return { ...prev, dressColor: colorHex };
      }
      if (activeTab === "accessory") {
        return { ...prev, accessoryColor: colorHex };
      }
      return prev;
    });
  }

  // Get active items list in current category
  const categoryItems = AVATAR_ITEMS[activeTab] || [];

  // Determine if active category supports color pickers
  const categoryColorKey = 
    activeTab === "hairStyle" ? "hair" :
    activeTab === "top" ? "top" :
    activeTab === "dress" ? "dress" :
    activeTab === "accessory" ? "accessory" : null;

  const colorOptions = categoryColorKey ? AVATAR_COLORS[categoryColorKey] : [];

  const selectedColor = 
    activeTab === "hairStyle" ? currentLook.hairColor :
    activeTab === "top" ? currentLook.topColor :
    activeTab === "dress" ? currentLook.dressColor :
    activeTab === "accessory" ? currentLook.accessoryColor : "";

  return (
    <PageShell>
      <Confetti show={celebrate} />

      {toast && (
        <div
          role="status"
          className="animate-pop fixed inset-x-0 top-4 z-50 mx-auto w-[min(92%,32rem)] rounded-[var(--radius-blob)] bg-leaf-400 px-5 py-4 text-center font-display text-lg font-bold text-white shadow-[var(--shadow-soft)]"
        >
          {toast}
        </div>
      )}

      {/* Top Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}`} />
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="text-3xl">{child.profile.avatar}</span>
          <span className={c.text}>{child.profile.name}</span>
        </div>
        <PointsBadge points={points} />
      </div>

      <h1 className="mb-6 text-center font-display text-3xl font-bold text-ink">
        👕 Style Your Avatar
      </h1>

      {/* Animal Crossing Split Layout */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Avatar Preview Card */}
        <div className="flex flex-col gap-4 md:col-span-5">
          <Card className="flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-4 flex h-64 w-64 items-center justify-center rounded-[2.5rem] bg-white p-4 shadow-inner ring-4 ring-black/5">
              <AvatarRenderer avatar={currentLook} size={220} />
              
              {/* Star-eyes animation effect if space background is active */}
              {currentLook.background === "bg-space" && (
                <div className="pointer-events-none absolute inset-0 animate-pulse text-yellow-300 opacity-20">
                  ✨
                </div>
              )}
            </div>
            
            <h2 className="font-display text-2xl font-bold text-ink">
              Looking good, {child.profile.name}!
            </h2>
            <p className="mb-4 font-display text-sm text-ink/60">
              Customize your hair, clothes, and accessories!
            </p>

            <Button
              color={child.profile.color}
              size="lg"
              className="w-full shadow-md"
              onClick={handleSave}
            >
              💾 Save Outfit
            </Button>
          </Card>
        </div>

        {/* Right Side: Avatar Editor Controls */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Horizontal Emojis Category Tabs Scroll */}
          <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 shrink-0 rounded-2xl px-4 py-3 font-display font-bold text-sm transition-all duration-200 tap",
                    active
                      ? "bg-sunny-400 text-ink shadow-[var(--shadow-pop)]"
                      : "bg-white/80 text-ink/75 hover:bg-white"
                  )}
                >
                  <span className="text-2xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Card className="flex-1 p-5">
            {/* Color Swatch Picker */}
            {colorOptions.length > 0 && (
              <div className="mb-5 rounded-2xl bg-black/5 p-3">
                <p className="mb-2 font-display text-sm font-bold text-ink/70">
                  Pick a Color:
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((co) => {
                    const active = selectedColor.toLowerCase() === co.hex.toLowerCase();
                    return (
                      <button
                        key={co.hex}
                        onClick={() => handleColorSelect(co.hex)}
                        title={co.name}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 border-black/10 transition-transform hover:scale-110 active:scale-95",
                          active ? "ring-2 ring-black/80 ring-offset-2 scale-110" : ""
                        )}
                        style={{ backgroundColor: co.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items Grid */}
            <p className="mb-3 font-display text-base font-bold text-ink/80">
              Pick your style:
            </p>
            
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 md:grid-cols-3">
              {categoryItems.map((item) => {
                const isSelected = currentLook[item.category] === item.id;
                const isUnlocked = currentLook.unlockedItems.includes(item.id) || item.cost === 0;
                const affordable = points >= item.cost;
                const need = item.cost - points;

                // Mini preview inside the item selector grid
                let previewColor = "";
                if (item.category === "skin") previewColor = item.value || "#ffe0bd";
                if (item.category === "background") previewColor = item.value || "#ffffff";

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "group flex flex-col items-center justify-between gap-2 rounded-2xl p-3 border-2 text-center transition-all duration-200 tap",
                      isSelected
                        ? "border-sunny-400 bg-sunny-50/50 shadow-sm"
                        : "border-black/5 bg-white/50 hover:bg-white"
                    )}
                  >
                    {/* Item Visual Preview */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5 font-display text-2xl group-hover:scale-105 transition-transform overflow-hidden relative">
                      {item.category === "skin" && (
                        <div className="h-8 w-8 rounded-full shadow-sm" style={{ backgroundColor: previewColor }} />
                      )}
                      {item.category === "background" && (
                        <div className="absolute inset-0" style={{ background: previewColor }} />
                      )}
                      
                      {/* Placeholder generic indicators for dress/accessories */}
                      {item.category === "eyes" && (item.id === "eyes-cool" ? "😎" : item.id === "eyes-nerd" ? "🤓" : "👁️")}
                      {item.category === "hairStyle" && (item.id === "hair-pinkie" ? "🐴" : "💇")}
                      {item.category === "top" && (item.id === "top-jersey" ? "⚽" : item.id === "top-roblox-hoodie" ? "🪙" : "👕")}
                      {item.category === "dress" && (item.id === "dress-tulle-skirt" ? "👗" : item.id === "dress-princess" ? "👑" : "👗")}
                      {item.category === "accessory" && (item.id === "acc-crown" ? "👑" : item.id === "acc-gojo" ? "🕶️" : item.id === "acc-unicorn" ? "🦄" : "🎀")}
                    </div>

                    <span className="font-display text-sm font-bold text-ink leading-tight">
                      {item.name}
                    </span>

                    {/* Cost / Unlock Badge */}
                    {!isUnlocked ? (
                      affordable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(item);
                          }}
                          className="w-full rounded-xl bg-sunny-400 py-1.5 font-display text-xs font-bold text-ink shadow-[var(--shadow-pop)] tap"
                        >
                          ⭐ {item.cost.toLocaleString()}
                        </button>
                      ) : (
                        <span
                          title={`${need.toLocaleString()} more stars needed`}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-black/5 py-1.5 font-display text-xs font-bold text-ink/50"
                        >
                          🔒 {item.cost >= 1000 ? `${(item.cost / 1000).toFixed(0)}k` : item.cost}
                        </span>
                      )
                    ) : (
                      <span className={cn(
                        "font-display text-xs font-semibold px-2 py-0.5 rounded-full",
                        isSelected ? "bg-sunny-200 text-sunny-700" : "bg-black/5 text-ink/60"
                      )}>
                        {isSelected ? "Equipped" : "Unlocked"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
