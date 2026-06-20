"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PROFILES } from "@/lib/data";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Settings() {
  const { state, setParentPin, setReminderTime, setDailyGoal, resetChild } = useApp();
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  function savePin() {
    if (pin1.length < 4) return setPinMsg("PIN must be at least 4 digits.");
    if (pin1 !== pin2) return setPinMsg("PINs do not match.");
    setParentPin(pin1);
    setPin1("");
    setPin2("");
    setPinMsg("Saved ✓");
  }

  const field =
    "w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-3 font-display text-lg outline-none focus:border-grape-400";

  return (
    <div className="space-y-6 rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="font-display text-lg font-bold text-grape-600">⚙️ Settings</h3>

      {/* PIN */}
      <div className="space-y-2">
        <label className="font-display text-sm font-semibold text-ink/70">Change parent PIN</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={field}
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            value={pin1}
            onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))}
          />
          <input
            className={field}
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button size="md" color="grape" onClick={savePin}>
            Save PIN
          </Button>
          {pinMsg && <span className="text-sm text-ink/60">{pinMsg}</span>}
        </div>
      </div>

      {/* Reminder time */}
      <div className="space-y-2">
        <label className="font-display text-sm font-semibold text-ink/70">Daily reminder time</label>
        <input
          className={cn(field, "max-w-[10rem]")}
          type="time"
          value={state.reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
        />
      </div>

      {/* Daily goals */}
      <div className="space-y-2">
        <label className="font-display text-sm font-semibold text-ink/70">Daily goal (quizzes/day)</label>
        <div className="space-y-2">
          {PROFILES.map((p) => {
            const goal = state.children[p.id].daily.dailyGoal;
            return (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-cream px-4 py-2">
                <span className="font-display font-semibold">
                  {p.avatar} {p.name}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    className="tap h-10 w-10 rounded-full bg-black/10 text-xl font-bold"
                    onClick={() => setDailyGoal(p.id, Math.max(1, goal - 1))}
                    aria-label={`Decrease goal for ${p.name}`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-display text-xl font-bold">{goal}</span>
                  <button
                    className="tap h-10 w-10 rounded-full bg-black/10 text-xl font-bold"
                    onClick={() => setDailyGoal(p.id, Math.min(10, goal + 1))}
                    aria-label={`Increase goal for ${p.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="space-y-2">
        <label className="font-display text-sm font-semibold text-coral-600">Reset progress</label>
        <div className="space-y-2">
          {PROFILES.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl bg-coral-100 px-4 py-2">
              <span className="font-display font-semibold">
                {p.avatar} {p.name}
              </span>
              {confirmReset === p.id ? (
                <div className="flex gap-2">
                  <Button
                    size="md"
                    color="coral"
                    onClick={() => {
                      resetChild(p.id);
                      setConfirmReset(null);
                    }}
                  >
                    Confirm
                  </Button>
                  <Button size="md" color="grape" variant="ghost" onClick={() => setConfirmReset(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="md" color="coral" variant="soft" onClick={() => setConfirmReset(p.id)}>
                  Reset
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
