"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type FeedFormatDefaults = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};

const DEFAULTS: FeedFormatDefaults = {
  monday: "carousel",
  tuesday: "reels",
  wednesday: "post",
  thursday: "reels",
  friday: "carousel",
  saturday: "",
  sunday: "",
};

const DAYS = [
  { key: "monday", label: "Seg" },
  { key: "tuesday", label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday", label: "Qui" },
  { key: "friday", label: "Sex" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
] as const;

const FORMAT_OPTIONS = [
  { value: "", label: "Sem feed" },
  { value: "carousel", label: "Carrossel" },
  { value: "reels", label: "Reels" },
  { value: "post", label: "Post" },
];

export function FeedFormatDefaultsCard() {
  const [defaults, setDefaults] = useState<FeedFormatDefaults>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/feed-defaults")
      .then((res) => res.json())
      .then((data) => {
        if (data.defaults) {
          setDefaults({ ...DEFAULTS, ...data.defaults });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (day: keyof FeedFormatDefaults, value: string) => {
    setDefaults((prev) => ({ ...prev, [day]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/feed-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Formato Padrão de Feed</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(({ key, label }) => (
          <div key={key} className="text-center">
            <p className="mb-1 text-xs text-slate-400">{label}</p>
            <select
              value={defaults[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Define o formato padrão de feed para cada dia da semana.
      </p>
    </div>
  );
}
