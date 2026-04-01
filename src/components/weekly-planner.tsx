"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nexus-weekly-planner-v1";

type DayPlan = {
  day: string;
  feedFormat: string;
  feedTime: string;
  nicheOrBrand: string;
  angle: string;
  themeMode: string;
  caption: string;
  hashtags: string;
  story1: string;
  story2: string;
  story3: string;
  storyTimes: string[];
};

const defaultPlan: DayPlan[] = [
  { day: "Segunda", feedFormat: "Carrossel", feedTime: "12:00", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Terça", feedFormat: "Reel", feedTime: "12:00", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Quarta", feedFormat: "Post", feedTime: "12:00", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Quinta", feedFormat: "Reel", feedTime: "12:00", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Sexta", feedFormat: "Carrossel", feedTime: "12:00", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Sábado", feedFormat: "Sem feed", feedTime: "—", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
  { day: "Domingo", feedFormat: "Sem feed", feedTime: "—", nicheOrBrand: "", angle: "", themeMode: "", caption: "", hashtags: "", story1: "", story2: "", story3: "", storyTimes: ["08:00", "12:00", "18:00"] },
];

export function WeeklyPlanner() {
  const [plan, setPlan] = useState<DayPlan[]>(defaultPlan);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.plan)) setPlan(parsed.plan);
      if (parsed.savedAt) setSavedAt(parsed.savedAt);
    } catch {}
  }, []);

  const save = (next: DayPlan[]) => {
    const payload = { plan: next, savedAt: new Date().toISOString() };
    setPlan(next);
    setSavedAt(payload.savedAt);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const update = (index: number, field: keyof DayPlan, value: string) => {
    const next = [...plan];
    next[index] = { ...next[index], [field]: value };
    save(next);
  };

  const exportJson = useMemo(() => JSON.stringify({ plan, savedAt }, null, 2), [plan, savedAt]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-xl shadow-black/10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Grade semanal preenchível</h2>
          <p className="mt-1 text-sm text-white/70">
            Você define nicho, marca, ângulo, caption, hashtags e os 3 focos de stories. Os formatos e horários já ficam fixos.
          </p>
        </div>
        <div className="text-right text-xs text-white/50">
          <div>Produção: 20:00 do dia anterior</div>
          <div>Feed: 12:00</div>
          <div>Stories: 08:00 / 12:00 / 18:00</div>
          {savedAt ? <div className="mt-2">Salvo localmente: {new Date(savedAt).toLocaleString("pt-BR")}</div> : null}
        </div>
      </div>

      <div className="space-y-4">
        {plan.map((row, index) => (
          <div key={row.day} className="rounded-xl border border-white/10 bg-black/10 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{row.day}</div>
              <div className="text-sm text-white/60">Feed: {row.feedFormat} {row.feedTime !== "—" ? `às ${row.feedTime}` : ""}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1 text-white/70">Nicho ou marca</div>
                <input value={row.nicheOrBrand} onChange={(e) => update(index, "nicheOrBrand", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-white/70">Ângulo</div>
                <input value={row.angle} onChange={(e) => update(index, "angle", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-white/70">Theme mode</div>
                <input value={row.themeMode} onChange={(e) => update(index, "themeMode", e.target.value)} placeholder="product ou brand" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm md:col-span-2">
                <div className="mb-1 text-white/70">Caption / direção da peça</div>
                <textarea value={row.caption} onChange={(e) => update(index, "caption", e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm md:col-span-2">
                <div className="mb-1 text-white/70">Hashtags</div>
                <input value={row.hashtags} onChange={(e) => update(index, "hashtags", e.target.value)} placeholder="#SalaoDeBeleza #AgendamentoOnline #NexusAutomacao" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm">
                <div className="mb-1 text-white/70">Story 1 ({row.storyTimes[0]})</div>
                <textarea value={row.story1} onChange={(e) => update(index, "story1", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-white/70">Story 2 ({row.storyTimes[1]})</div>
                <textarea value={row.story2} onChange={(e) => update(index, "story2", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-white/70">Story 3 ({row.storyTimes[2]})</div>
                <textarea value={row.story3} onChange={(e) => update(index, "story3", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none" />
              </label>
            </div>
          </div>
        ))}
      </div>

      <details className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
        <summary className="cursor-pointer text-sm font-medium text-white/80">Exportar JSON da grade</summary>
        <pre className="mt-3 overflow-x-auto text-xs text-white/70">{exportJson}</pre>
      </details>
    </section>
  );
}
