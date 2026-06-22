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
import { ThreeAvatarRenderer } from "@/components/ThreeAvatarRenderer";

const CATEGORY_TABS: { key: AvatarCategory; label: string }[] = [
  { key: "skin", label: "Skin" },
  { key: "eyes", label: "Eyes" },
  { key: "hairStyle", label: "Hair" },
  { key: "top", label: "Tops" },
  { key: "dress", label: "Dresses" },
  { key: "accessory", label: "Accessories" },
  { key: "background", label: "Backgrounds" },
];

const CATEGORY_ICONS: Record<AvatarCategory, React.ReactNode> = {
  skin: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>,
  eyes: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  hairStyle: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><path d="M4 12c0 2 1 4 2 5M20 12c0 2-1 4-2 5"/><line x1="12" y1="4" x2="12" y2="2"/></svg>,
  top: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21V8l-4-4H8L4 8v13h16z"/><path d="M8 4l4 4 4-4"/></svg>,
  dress: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2l-4 8h4l-2 12h12l-2-12h4L16 2z"/></svg>,
  accessory: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L9 8.5 2 9.3l5 5-1.2 7.2L12 18l6.2 3.5L17 14.3l5-5-7-.8z"/></svg>,
  background: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
};

export default function AvatarCustomizerPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;
  const router = useRouter();

  const { child, hydrated, saveAvatar, deductPoints } = useChild(id);

  // Character preview state (loaded from saved look or default)
  const [currentLook, setCurrentLook] = useState<ChildAvatar | null>(null);
  const [activeTab, setActiveTab] = useState<AvatarCategory>("skin");
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [previewMode, setPreviewMode] = useState<"2D" | "3D">("3D");

  // Sync saved look when store is hydrated
  useEffect(() => {
    if (hydrated && child) {
      if (child.avatar) {
        setCurrentLook(child.avatar);
      } else {
        // Fallback to default avatar
        setCurrentLook({
          ...DEFAULT_AVATAR,
          skin: "skin-fair",
          unlockedItems: [...DEFAULT_AVATAR.unlockedItems],
        });
      }
    }
  }, [hydrated, child]);

  // Determine cart items (items currently equipped in currentLook but not owned by the child)
  const cartItems = useMemo(() => {
    if (!currentLook || !child) return [];
    const items: AvatarItem[] = [];
    const categories: AvatarCategory[] = ["skin", "eyes", "hairStyle", "top", "dress", "accessory", "background"];
    const ownedList = child.avatar?.unlockedItems || DEFAULT_AVATAR.unlockedItems;

    for (const cat of categories) {
      const equippedId = currentLook[cat];
      const item = AVATAR_ITEMS[cat]?.find((i) => i.id === equippedId);
      // If equipped item is not owned and has a cost > 0, it is in the try-on cart
      if (item && item.cost > 0 && !ownedList.includes(equippedId)) {
        items.push(item);
      }
    }
    return items;
  }, [currentLook, child]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.cost, 0);
  }, [cartItems]);

  if (!hydrated || !currentLook) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const c = COLOR_CLASSES[child.profile.color];
  const points = child.rewards.points;

  // Handle final checkout and outfit saving
  function handleCheckoutAndSave() {
    if (!currentLook) return;

    if (points < cartTotal) {
      setToast("Oops! Not enough stars to buy all the items in your cart. ⭐");
      return;
    }

    // Deduct total cost
    if (cartTotal > 0) {
      deductPoints(cartTotal);
    }

    // Unlock all items in cart
    const newUnlocked = [...(child.avatar?.unlockedItems || DEFAULT_AVATAR.unlockedItems)];
    cartItems.forEach((item) => {
      if (!newUnlocked.includes(item.id)) {
        newUnlocked.push(item.id);
      }
    });

    const finalLook: ChildAvatar = {
      ...currentLook,
      unlockedItems: newUnlocked,
    };

    saveAvatar(finalLook);
    setToast("Outfit purchased and saved successfully! 🎉");
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1500);
    window.setTimeout(() => {
      setToast(null);
      router.push(`/play/${id}`);
    }, 2000);
  }

  // Equipping items (or triggering try-on)
  function handleItemClick(item: AvatarItem) {
    if (!currentLook) return;

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

  // Resolve dynamic background for canvas container
  const bgItem = AVATAR_ITEMS.background.find(i => i.id === currentLook.background);
  const canvasBg = bgItem?.value || '#ffffff';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
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
        🛍️ Able Sisters Outfit Shop
      </h1>

      {/* Split Layout */}
      <div className="grid gap-6 md:grid-cols-12 pb-24">
        {/* Left Side: Avatar Preview - Sticky Horizontal on Mobile / Vertical on Desktop */}
        <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-4 border-b-4 border-dashed border-[#efebe4] bg-[#fdfbf7]/95 px-4 py-3 backdrop-blur-md md:static md:col-span-5 md:mx-0 md:mb-0 md:flex-col md:items-stretch md:gap-4 md:border-b-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="hidden md:flex md:flex-col md:items-center md:justify-center md:p-6 md:text-center md:bg-[#fdfbf7] md:border-4 md:border-dashed md:border-[#d4c8b8] md:rounded-[2.5rem] md:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.1),_inset_0_-8px_0_0_rgba(0,0,0,0.04),_inset_0_8px_0_0_rgba(255,255,255,0.7)] md:sticky md:top-6">
            {/* Toggle Preview Button - Desktop */}
            <div className="mb-4 flex rounded-full bg-[#f1edeb] p-1.5 shadow-inner">
              <button
                onClick={() => setPreviewMode("3D")}
                className={cn(
                  "rounded-full px-4 py-1.5 font-display text-xs font-bold transition-all",
                  previewMode === "3D"
                    ? "bg-sunny-400 text-ink shadow-sm"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                🎥 3D Rotate
              </button>
              <button
                onClick={() => setPreviewMode("2D")}
                className={cn(
                  "rounded-full px-4 py-1.5 font-display text-xs font-bold transition-all",
                  previewMode === "2D"
                    ? "bg-sunny-400 text-ink shadow-sm"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                🎨 2D Classic
              </button>
            </div>

            {/* Canvas Preview Area - Desktop */}
            <div className="relative mb-5 flex h-72 w-72 items-center justify-center overflow-hidden rounded-[2.5rem] border-4 border-dashed border-[#d4c8b8] shadow-[inset_0_4px_10px_0_rgba(0,0,0,0.06)]" style={{ background: canvasBg }}>
              {previewMode === "3D" ? (
                <ThreeAvatarRenderer avatar={currentLook} size={280} />
              ) : (
                <AvatarRenderer avatar={currentLook} size={250} />
              )}

              {/* Space Background effect overlay */}
              {currentLook.background === "bg-space" && (
                <div className="pointer-events-none absolute inset-0 animate-pulse text-yellow-300 opacity-20">
                  ✨
                </div>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold text-ink">
              Looking good, {child.profile.name}!
            </h2>
            <p className="font-display text-sm text-ink/60 max-w-[240px] leading-relaxed">
              Drag to spin in 3D! Check locked items to try them on.
            </p>
          </div>

          {/* Mobile: Compact horizontal preview */}
          <div className="flex shrink-0 md:hidden">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 border-dashed border-[#d4c8b8] shadow-[inset_0_4px_10px_0_rgba(0,0,0,0.06)]" style={{ background: canvasBg }}>
              {previewMode === "3D" ? (
                <ThreeAvatarRenderer avatar={currentLook} size={120} />
              ) : (
                <AvatarRenderer avatar={currentLook} size={110} />
              )}
            </div>
          </div>

          {/* Mobile: Name + Toggle stacked beside canvas */}
          <div className="flex flex-col gap-2 md:hidden">
            <h2 className="font-display text-lg font-bold text-ink leading-tight">
              {child.profile.name}
            </h2>
            <div className="flex rounded-full bg-[#f1edeb] p-1 shadow-inner">
              <button
                onClick={() => setPreviewMode("3D")}
                className={cn(
                  "rounded-full px-3 py-1 font-display text-[10px] font-bold transition-all",
                  previewMode === "3D"
                    ? "bg-sunny-400 text-ink shadow-sm"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                🎥 3D
              </button>
              <button
                onClick={() => setPreviewMode("2D")}
                className={cn(
                  "rounded-full px-3 py-1 font-display text-[10px] font-bold transition-all",
                  previewMode === "2D"
                    ? "bg-sunny-400 text-ink shadow-sm"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                🎨 2D
              </button>
            </div>
            <p className="font-display text-[10px] text-ink/50 leading-snug">
              Drag to spin in 3D!
            </p>
          </div>
        </div>

        {/* Right Side: Editor Controls (Animal Crossing layout) */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Circular SVG Categories Tabs */}
          <div className="flex w-full gap-3 overflow-x-auto pb-4 pt-1 justify-start scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 shrink-0 transition-transform active:scale-95 hover:scale-105",
                    active ? "scale-105" : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all border-4 shadow-md",
                      active
                        ? "bg-sunny-400 border-sunny-500 text-ink scale-110 shadow-lg"
                        : "bg-white border-[#efebe4] text-ink/75 hover:bg-clay-50"
                    )}
                  >
                    {CATEGORY_ICONS[tab.key]}
                  </div>
                  <span className={cn(
                    "font-display text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full",
                    active ? "bg-sunny-200 text-sunny-800" : "text-ink/60"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-6 bg-[#fdfbf7] border-4 border-dashed border-[#d4c8b8] rounded-[2.5rem] shadow-[0_12px_24px_-4px_rgba(0,0,0,0.1),_inset_0_-8px_0_0_rgba(0,0,0,0.04),_inset_0_8px_0_0_rgba(255,255,255,0.7)]">
            {/* Color Swatch Picker */}
            {colorOptions.length > 0 && (
              <div className="mb-6 rounded-[2rem] bg-[#f1edeb] p-4 shadow-inner">
                <p className="mb-3 font-display text-sm font-bold text-ink/70">
                  Pick a Color variant:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((co) => {
                    const active = selectedColor.toLowerCase() === co.hex.toLowerCase();
                    return (
                      <button
                        key={co.hex}
                        onClick={() => handleColorSelect(co.hex)}
                        title={co.name}
                        className={cn(
                          "h-9 w-9 rounded-full border-2 border-black/10 transition-transform hover:scale-110 active:scale-95 shadow-sm",
                          active ? "ring-4 ring-sunny-400 ring-offset-2 scale-110" : ""
                        )}
                        style={{ backgroundColor: co.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items Grid */}
            <p className="mb-4 font-display text-base font-bold text-ink/80">
              Select item to try on:
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1 md:grid-cols-3 scrollbar-none">
              {categoryItems.map((item) => {
                const isSelected = currentLook[item.category] === item.id;
                const ownedList = child.avatar?.unlockedItems || DEFAULT_AVATAR.unlockedItems;
                const isUnlocked = ownedList.includes(item.id) || item.cost === 0;

                // Mini preview colors for skin / bg
                let previewColor = "";
                if (item.category === "skin") previewColor = item.value || "#ffe0bd";
                if (item.category === "background") previewColor = item.value || "#ffffff";

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "group relative flex flex-col items-center justify-between gap-2.5 rounded-3xl p-4 border-4 text-center transition-all duration-200 tap",
                      isSelected
                        ? "border-sunny-400 bg-sunny-50/50 shadow-md scale-[1.02]"
                        : "border-[#efebe4] bg-white hover:border-clay-300"
                    )}
                  >
                    {/* Tick Checkmark if owned, or Shopping Cart if in try-on cart */}
                    {isUnlocked ? (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white">
                        ✓
                      </div>
                    ) : isSelected ? (
                      <div className="absolute top-2 right-2 bg-sunny-500 text-ink rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white animate-bounce">
                        🛒
                      </div>
                    ) : null}

                    {/* Item Visual Preview */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f6f2] font-display text-3xl group-hover:scale-105 transition-transform overflow-hidden relative border border-clay-100 shadow-inner">
                      {item.category === "skin" && (
                        <div className="h-9 w-9 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: previewColor }} />
                      )}
                      {item.category === "background" && (
                        <div className="absolute inset-0" style={{ background: previewColor }} />
                      )}
                      
                      {/* Icons for items */}
                      {item.category === "eyes" && (item.id === "eyes-cool" ? "😎" : item.id === "eyes-nerd" ? "🤓" : item.id === "eyes-sparkle" ? "✨" : "👁️")}
                      {item.category === "hairStyle" && (item.id === "hair-pinkie" ? "🐴" : "💇")}
                      {item.category === "top" && (item.id === "top-jersey" ? "⚽" : item.id === "top-roblox-hoodie" ? "🪙" : "👕")}
                      {item.category === "dress" && (item.id === "dress-tulle-skirt" ? "👗" : item.id === "dress-princess" ? "👑" : "👗")}
                      {item.category === "accessory" && (item.id === "acc-crown" ? "👑" : item.id === "acc-gojo" ? "🕶️" : item.id === "acc-unicorn" ? "🦄" : "🎀")}
                    </div>

                    <span className="font-display text-xs font-bold text-ink leading-tight">
                      {item.name}
                    </span>

                    {/* Price / Owned badge */}
                    {!isUnlocked ? (
                      <div className={cn(
                        "rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold flex items-center gap-1",
                        isSelected ? "bg-sunny-300 text-ink shadow-sm" : "bg-[#f1edeb] text-ink/60"
                      )}>
                        ⭐ {item.cost.toLocaleString()}
                      </div>
                    ) : (
                      <span className="font-display text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Owned
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfbf7]/95 backdrop-blur-md border-t-4 border-[#efebe4] py-4 px-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sunny-400 flex items-center justify-center text-2xl shadow-md border-2 border-sunny-500">
            🛒
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink/75">Checkout Cart</h3>
            <p className="font-display text-lg font-bold text-ink flex items-center gap-1.5">
              Total Try-On Cost: <span className="text-sunny-600">⭐ {cartTotal.toLocaleString()} Stars</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => {
              // reset outfit to original saved look
              if (child.avatar) {
                setCurrentLook(child.avatar);
              }
              setToast("Cart cleared and reset to saved look!");
              window.setTimeout(() => setToast(null), 1500);
            }}
            className="w-full sm:w-auto border-2 border-clay-300 bg-white hover:bg-clay-50 font-display text-sm font-bold text-ink/80 rounded-2xl px-6 py-3.5"
          >
            ❌ Clear Try-On
          </Button>

          <Button
            onClick={handleCheckoutAndSave}
            color={child.profile.color}
            className="w-full sm:w-auto font-display text-sm font-bold rounded-2xl px-8 py-3.5 shadow-lg border-b-4 border-black/10"
          >
            {cartTotal > 0 ? `🛒 Buy & Wear Outfit` : `💾 Save Look`}
          </Button>
        </div>
      </div>
    </main>
  );
}
