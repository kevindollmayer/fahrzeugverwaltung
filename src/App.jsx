import BenzinImBlutKachel from "./BenzinImBlutKachel";
import Select from "react-select";
import { MARKEN } from "./automarken";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutGrid,
  Search,
  Plus,
  X,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ParkingSquare,
  Trash2,
  Pencil,
  ChevronDown,
  Sun,
  Moon,
  Table2,
} from "lucide-react";

/* ---------------------------------------------------------
   Fahrzeugübersicht — Fuhrpark-Verwaltung
   Seitenleiste + Hell/Dunkel-Modus, ruhige Fachanwendungs-Optik.
--------------------------------------------------------- */

const SCHWELLE_GELB = 14;
const SCHWELLE_ORANGE = 21;
const SCHWELLE_ROT = 30;

const heuteISO = () => new Date().toISOString().slice(0, 10);

const tageSeit = (datumISO) => {
  if (!datumISO) return null;
  const start = new Date(datumISO + "T00:00:00");
  const heute = new Date(heuteISO() + "T00:00:00");
  return Math.round((heute - start) / (1000 * 60 * 60 * 24));
};

const standzeitStufe = (tage) => {
  if (tage === null) return "neutral";
  if (tage >= SCHWELLE_ROT) return "rot";
  if (tage >= SCHWELLE_ORANGE) return "orange";
  if (tage >= SCHWELLE_GELB) return "gelb";
  return "neutral";
};

function formatDatum(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function erzeugeStellplaetze(anzahl) {
  const arr = [];
  for (let i = 1; i <= anzahl; i++) {
    arr.push({
      id: i,
      vin: "",
      kennzeichen: "",
      marke: "",
      eingangsdatum: "",
      zulassung: "",
    });
  }
  return arr;
}

const START_ANZAHL = 60;

/* ---------------- Theme-Tokens ---------------- */
const THEMES = {
  hell: {
    bg: "#F4F5F7",
    panel: "#FFFFFF",
    panelAlt: "#FAFBFC",
    border: "#E2E5E9",
    borderSoft: "#EEF0F2",
    text: "#0F172A",
    textMuted: "#64748B",
    textFaint: "#94A3B8",
    sidebarBg: "#111827",
    sidebarText: "#CBD5E1",
    sidebarTextActive: "#FFFFFF",
    sidebarActiveBg: "rgba(255,255,255,0.08)",
    accent: "#0F172A",
    accentText: "#FFFFFF",
    ring: "#0F172A",
    ringTrack: "#EEF0F2",
    inputBg: "#F1F3F5",
    hoverRow: "rgba(15,23,42,0.03)",
  },
  dunkel: {
    bg: "#0B0F14",
    panel: "#141A21",
    panelAlt: "#10151B",
    border: "#232B34",
    borderSoft: "#1B222A",
    text: "#E7EBEF",
    textMuted: "#93A0AD",
    textFaint: "#63707D",
    sidebarBg: "#0A0D12",
    sidebarText: "#8B99A6",
    sidebarTextActive: "#FFFFFF",
    sidebarActiveBg: "rgba(255,255,255,0.06)",
    accent: "#E7EBEF",
    accentText: "#0B0F14",
    ring: "#E7EBEF",
    ringTrack: "#232B34",
    inputBg: "#1B222A",
    hoverRow: "rgba(255,255,255,0.02)",
  },
};

const stufenPalette = {
  hell: {
    neutral: { dot: "#CBD5E1", text: "#64748B", bg: "#F1F3F5" },
    gelb: { dot: "#F5B62E", text: "#8A6205", bg: "#FEF3D6" },
    orange: { dot: "#F0812E", text: "#8A3E05", bg: "#FCE5D2" },
    rot: { dot: "#EF4A5D", text: "#8A0F1F", bg: "#FBDADE" },
  },
  dunkel: {
    neutral: { dot: "#3A4552", text: "#8B99A6", bg: "#1B222A" },
    gelb: { dot: "#E5B23D", text: "#F2CE7F", bg: "#2A2312" },
    orange: { dot: "#E08339", text: "#F0AB75", bg: "#2A1D10" },
    rot: { dot: "#E5495C", text: "#F29AA5", bg: "#2A1417" },
  },
};

export default function FahrzeugUebersicht() {
  const [modus, setModus] = useState("hell"); // hell | dunkel
  const t = THEMES[modus];
  const stufenFarben = stufenPalette[modus];

  const [stellplaetze, setStellplaetze] = useState(() => erzeugeStellplaetze(START_ANZAHL));
  const [ansicht, setAnsicht] = useState("dashboard");
  const [suche, setSuche] = useState("");
  const [editId, setEditId] = useState(null);
  const [neuPlatzOffen, setNeuPlatzOffen] = useState(false);
  const [meldung, setMeldung] = useState(null);
  useEffect(() => {
  async function laden() {
    const daten = await window.api.ladeFahrzeuge();

    const maxId = Math.max(
  START_ANZAHL,
  ...daten.map((f) => f.id)
);

const plaetze = erzeugeStellplaetze(maxId);

    daten.forEach((f) => {
      const index = plaetze.findIndex((p) => p.id === f.id);

      if (index !== -1) {
        plaetze[index] = f;
      }
    });

    setStellplaetze(plaetze);
  }

  laden();
}, []);

  useEffect(() => {
    if (!meldung) return;
    const timer = setTimeout(() => setMeldung(null), 2600);
    return () => clearTimeout(timer);
  }, [meldung]);

  const belegte = useMemo(() => stellplaetze.filter((p) => p.kennzeichen), [stellplaetze]);
  const freie = useMemo(() => stellplaetze.filter((p) => !p.kennzeichen), [stellplaetze]);

  const standzeitStats = useMemo(() => {
    const stats = { gelb: 0, orange: 0, rot: 0 };
    belegte.forEach((p) => {
      const stufe = standzeitStufe(tageSeit(p.eingangsdatum));
      if (stufe !== "neutral") stats[stufe]++;
    });
    return stats;
  }, [belegte]);

  const kritische = standzeitStats.orange + standzeitStats.rot;
  const auslastungProzent = stellplaetze.length ? Math.round((belegte.length / stellplaetze.length) * 100) : 0;

  const gefundenerPlatz = useMemo(() => {
    if (!suche.trim()) return null;
    const norm = (s) => s.toLowerCase().replace(/[\s-]/g, "");
    const q = norm(suche);
    return stellplaetze.find((p) => p.kennzeichen && norm(p.kennzeichen).includes(q)) || "not_found";
  }, [suche, stellplaetze]);

  async function aktualisierePlatz(id, patch) {
  const fahrzeug = stellplaetze.find((p) => p.id === id);
  const neu = { ...fahrzeug, ...patch };

  await window.api.speichereFahrzeug(neu);

  setStellplaetze((prev) =>
    prev.map((p) => (p.id === id ? neu : p))
  );
}

  function platzLeeren(id) {
    aktualisierePlatz(id, { vin: "", kennzeichen: "", marke: "", eingangsdatum: "", zulassung: "" });
    setMeldung("Stellplatz geräumt");
  }

  async function stellplatzHinzufuegen() {
  const naechsteId =
    stellplaetze.length
      ? Math.max(...stellplaetze.map((p) => p.id)) + 1
      : 1;

  const neuerPlatz = {
    id: naechsteId,
    vin: "",
    kennzeichen: "",
    marke: "",
    eingangsdatum: "",
    zulassung: "",
    foto: "",
  };

  // In SQLite speichern
  await window.api.speichereFahrzeug(neuerPlatz);

  // In React anzeigen
  setStellplaetze((prev) => [...prev, neuerPlatz]);

  setNeuPlatzOffen(false);
  setMeldung("Stellplatz angelegt");
}

  function stellplatzEntfernen(id) {
    setStellplaetze((prev) => prev.filter((p) => p.id !== id));
    setMeldung("Stellplatz entfernt");
  }

  const ctx = { t, stufenFarben, modus };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: t.bg, color: t.text, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <Sidebar t={t} ansicht={ansicht} setAnsicht={setAnsicht} modus={modus} setModus={setModus} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar t={t} suche={suche} setSuche={setSuche} gefundenerPlatz={gefundenerPlatz} />

        <main className="flex-1 px-7 py-6 max-w-[1650px] w-full mx-auto">
          {ansicht === "dashboard" && (
            <Dashboard
              ctx={ctx}
              stellplaetze={stellplaetze}
              belegte={belegte}
              freie={freie}
              auslastungProzent={auslastungProzent}
              standzeitStats={standzeitStats}
              kritische={kritische}
              gehePlan={() => setAnsicht("plan")}
              geheListe={() => setAnsicht("liste")}
            />
          )}

          {ansicht === "plan" && (
            <PlanAnsicht
              ctx={ctx}
              stellplaetze={stellplaetze}
              editId={editId}
              setEditId={setEditId}
              aktualisierePlatz={aktualisierePlatz}
              platzLeeren={platzLeeren}
              stellplatzEntfernen={stellplatzEntfernen}
              neuPlatzOffen={neuPlatzOffen}
              setNeuPlatzOffen={setNeuPlatzOffen}
              stellplatzHinzufuegen={stellplatzHinzufuegen}
            />
          )}

          {ansicht === "liste" && (
            <ListeAnsicht
              ctx={ctx}
              stellplaetze={stellplaetze}
              editId={editId}
              setEditId={setEditId}
              aktualisierePlatz={aktualisierePlatz}
              platzLeeren={platzLeeren}
            />
          )}
        </main>
      </div>

      {meldung && (
        <div
          className="fixed bottom-6 right-6 text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-[fadein_0.15s_ease-out]"
          style={{ background: t.text, color: t.bg }}
        >
          <CheckCircle2 size={16} style={{ color: "#34D399" }} />
          {meldung}
        </div>
      )}

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform:none; } }
        input::placeholder, select { color-scheme: ${modus === "dunkel" ? "dark" : "light"}; }
      `}</style>
    </div>
  );
}

/* ---------------- Seitenleiste ---------------- */

function Sidebar({ t, ansicht, setAnsicht, modus, setModus }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "plan", label: "Stellplatzplan", icon: ParkingSquare },
    { key: "liste", label: "Fahrzeuge", icon: Table2 },
  ];
  return (
    <aside
      className="w-60 shrink-0 flex flex-col justify-between py-5"
      style={{ background: t.sidebarBg, color: t.sidebarText }}
    >
      <div>
        <div className="flex items-center gap-2.5 px-5 mb-7">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: t.accent }}>
            <Car size={16} style={{ color: t.accentText }} />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[14px] tracking-tight" style={{ color: t.sidebarTextActive }}>
              Fahrzeugübersicht
            </div>
            <div className="text-[11px]" style={{ color: t.textFaint }}>Fuhrparkverwaltung</div>
          </div>
        </div>

        <nav className="px-3 space-y-0.5">
          {items.map(({ key, label, icon: Icon }) => {
            const active = ansicht === key;
            return (
              <button
                key={key}
                onClick={() => setAnsicht(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  background: active ? t.sidebarActiveBg : "transparent",
                  color: active ? t.sidebarTextActive : t.sidebarText,
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-3 space-y-3">
        <button
          onClick={() => setModus(modus === "hell" ? "dunkel" : "hell")}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", color: t.sidebarText }}
        >
          <span className="flex items-center gap-2.5">
            {modus === "hell" ? <Sun size={14} /> : <Moon size={14} />}
            {modus === "hell" ? "Hell" : "Dunkel"}
          </span>
          <span
            className="rounded-full relative transition-colors shrink-0"
            style={{ background: modus === "dunkel" ? "#3B82F6" : "#475569", height: 18, width: 32 }}
          >
            <span
              className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all"
              style={{ left: modus === "dunkel" ? 16 : 2 }}
            />
          </span>
        </button>
        <div className="px-3 text-[11px]" style={{ color: t.textFaint }}>Version 1.0</div>
      </div>
    </aside>
  );
}

/* ---------------- Top Bar ---------------- */

function TopBar({ t, suche, setSuche, gefundenerPlatz }) {
  return (
    <header className="h-16 flex items-center px-7 border-b shrink-0" style={{ borderColor: t.border, background: t.panel }}>
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Kennzeichen suchen…"
          className="w-full rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none transition-colors border"
          style={{ background: t.inputBg, color: t.text, borderColor: "transparent", fontFamily: "ui-monospace, monospace" }}
        />
        {suche.trim() && (
          <div
            className="absolute top-full mt-1.5 left-0 right-0 rounded-lg shadow-lg px-3 py-2.5 text-[13px] border"
            style={{ background: t.panel, borderColor: t.border }}
          >
            {gefundenerPlatz === "not_found" && (
              <span style={{ color: t.textMuted }}>Kein Fahrzeug mit diesem Kennzeichen gefunden.</span>
            )}
            {gefundenerPlatz && gefundenerPlatz !== "not_found" && (
              <span style={{ color: t.text }}>
                <span className="font-mono font-semibold">{gefundenerPlatz.kennzeichen}</span> steht auf{" "}
                <span className="font-semibold">Stellplatz {gefundenerPlatz.id}</span> ({gefundenerPlatz.marke || "Marke unbekannt"})
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* ---------------- Dashboard ---------------- */

function Kachel({ t, icon: Icon, label, value, sub, accentColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl p-5 transition-all border hover:shadow-sm"
      style={{ background: t.panel, borderColor: t.border }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: t.inputBg }}>
          <Icon size={17} style={{ color: t.textMuted }} />
        </div>
      </div>
      <div className="text-[28px] font-semibold tracking-tight" style={{ color: accentColor || t.text }}>
        {value}
      </div>
      <div className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>{label}</div>
      {sub && <div className="text-[12px] mt-2" style={{ color: t.textFaint }}>{sub}</div>}
    </button>
  );
}

function Dashboard({ ctx, stellplaetze, belegte, freie, auslastungProzent, standzeitStats, kritische, gehePlan, geheListe }) {
  const { t, stufenFarben } = ctx;

  const kuerzlich = useMemo(
    () => [...belegte].filter((p) => p.eingangsdatum).sort((a, b) => (a.eingangsdatum < b.eingangsdatum ? 1 : -1)).slice(0, 6),
    [belegte]
  );

  const kritischeListe = useMemo(
    () =>
      [...belegte]
        .map((p) => ({ ...p, tage: tageSeit(p.eingangsdatum) }))
        .filter((p) => p.tage !== null && p.tage >= SCHWELLE_GELB)
        .sort((a, b) => b.tage - a.tage)
        .slice(0, 6),
    [belegte]
  );

  const rot = { hell: "#B91C2E", dunkel: "#F29AA5" }[ctx.modus];
  const gruen = { hell: "#0F7A50", dunkel: "#6FDCAE" }[ctx.modus];

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h1 className="text-[20px] font-semibold tracking-tight">Übersicht</h1>
        <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>Stand: {formatDatum(heuteISO())}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kachel t={t} icon={ParkingSquare} label="Stellplätze gesamt" value={stellplaetze.length} onClick={gehePlan} />
        <Kachel t={t} icon={Car} label="Belegte Plätze" value={belegte.length} sub={`${auslastungProzent}% Auslastung`} onClick={geheListe} />
        <Kachel t={t} icon={CheckCircle2} label="Freie Plätze" value={freie.length} accentColor={gruen} onClick={gehePlan} />
        <Kachel
          t={t}
          icon={AlertTriangle}
          label="Kritische Standzeit"
          value={kritische}
          sub={`ab ${SCHWELLE_ORANGE} Tagen`}
          accentColor={kritische > 0 ? rot : undefined}
          onClick={geheListe}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
  <div className="rounded-xl p-4 border" style={{ background: t.panel, borderColor: t.border }}>
    <div className="text-[13px] font-medium mb-4" style={{ color: t.textMuted }}>
      Auslastung
    </div>

    <div className="flex items-center justify-center py-1">
      <RingChart t={t} prozent={auslastungProzent} />
    </div>

    <div
      className="flex justify-between text-[12px] mt-3 pt-3 border-t"
      style={{ color: t.textMuted, borderColor: t.borderSoft }}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.text }} />
        Belegt {belegte.length}
      </span>

      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.ringTrack }} />
        Frei {freie.length}
      </span>
    </div>
  </div>

  <div className="rounded-xl p-4 border" style={{ background: t.panel, borderColor: t.border }}>
    <div className="text-[13px] font-medium mb-4" style={{ color: t.textMuted }}>
      Standzeit-Ampel
    </div>

    <div className="space-y-3">
      <StandzeitBalken
        t={t}
        c={stufenFarben.gelb}
        label={`14–${SCHWELLE_ORANGE - 1} Tage`}
        wert={standzeitStats.gelb}
        max={belegte.length}
      />

      <StandzeitBalken
        t={t}
        c={stufenFarben.orange}
        label={`${SCHWELLE_ORANGE}–${SCHWELLE_ROT - 1} Tage`}
        wert={standzeitStats.orange}
        max={belegte.length}
      />

      <StandzeitBalken
        t={t}
        c={stufenFarben.rot}
        label={`${SCHWELLE_ROT}+ Tage`}
        wert={standzeitStats.rot}
        max={belegte.length}
      />
    </div>

    {kritische === 0 && (
      <p
        className="text-[12px] mt-4 pt-3 border-t"
        style={{ color: t.textFaint, borderColor: t.borderSoft }}
      >
        Keine kritischen Standzeiten.
      </p>
    )}
  </div>

  <div className="rounded-xl p-4 border" style={{ background: t.panel, borderColor: t.border }}>
    <div className="text-[13px] font-medium mb-4" style={{ color: t.textMuted }}>
      Zuletzt eingegangen
    </div>

    {kuerzlich.length === 0 && (
      <p className="text-[12px]" style={{ color: t.textFaint }}>
        Noch keine Fahrzeuge erfasst.
      </p>
    )}

    <div className="space-y-2.5">
      {kuerzlich.map((p) => (
        <div key={p.id} className="flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-medium truncate">{p.kennzeichen}</span>
            <span className="truncate" style={{ color: t.textFaint }}>
              {p.marke}
            </span>
          </div>

          <span className="shrink-0 ml-2" style={{ color: t.textFaint }}>
            {formatDatum(p.eingangsdatum)}
          </span>
        </div>
      ))}
    </div>
  </div>

  <div className="col-span-3">
    <BenzinImBlutKachel t={t} />
  </div>

</div>

      {kritischeListe.length > 0 && (
        <div className="rounded-xl overflow-hidden border" style={{ background: t.panel, borderColor: t.border }}>
          <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: t.borderSoft }}>
            <AlertTriangle size={15} style={{ color: stufenFarben.gelb.dot }} />
            <span className="text-[13px] font-medium" style={{ color: t.textMuted }}>Fahrzeuge mit langer Standzeit</span>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {kritischeListe.map((p) => {
                const stufe = standzeitStufe(p.tage);
                const c = stufenFarben[stufe];
                return (
                  <tr key={p.id} className="border-b last:border-0" style={{ borderColor: t.borderSoft }}>
                    <td className="px-5 py-2.5 w-20" style={{ color: t.textFaint }}>Platz {p.id}</td>
                    <td className="px-5 py-2.5 font-mono font-medium">{p.kennzeichen}</td>
                    <td className="px-5 py-2.5" style={{ color: t.textMuted }}>{p.marke}</td>
                    <td className="px-5 py-2.5" style={{ color: t.textMuted }}>seit {formatDatum(p.eingangsdatum)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium"
                        style={{ background: c.bg, color: c.text }}
                      >
                        <Clock size={11} /> {p.tage} Tage
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RingChart({ t, prozent }) {
  const radius = 52;
  const stroke = 10;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (prozent / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke={t.ringTrack} strokeWidth={stroke} />
      <circle
        cx="70" cy="70" r={radius} fill="none" stroke={t.ring} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="600" fill={t.text}>{prozent}%</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill={t.textFaint}>belegt</text>
    </svg>
  );
}

function StandzeitBalken({ t, c, label, wert, max }) {
  const breite = max > 0 ? Math.max((wert / max) * 100, wert > 0 ? 4 : 0) : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span style={{ color: t.textMuted }}>{label}</span>
        <span className="font-medium">{wert}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
        <div className="h-full rounded-full" style={{ width: `${breite}%`, background: c.dot, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

/* ---------------- Stellplatzplan ---------------- */

function PlanAnsicht({ ctx, stellplaetze, editId, setEditId, aktualisierePlatz, platzLeeren, stellplatzEntfernen, neuPlatzOffen, setNeuPlatzOffen, stellplatzHinzufuegen }) {
  const { t } = ctx;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Stellplatzplan</h1>
          <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>{stellplaetze.length} Stellplätze · Klicken zum Bearbeiten</p>
        </div>
        <button
          onClick={() => setNeuPlatzOffen(true)}
          className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-lg transition-colors"
          style={{ background: t.accent, color: t.accentText }}
        >
          <Plus size={15} /> Stellplatz hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {stellplaetze.map((p) => (
          <StellplatzKachel key={p.id} ctx={ctx} platz={p} onClick={() => setEditId(p.id)} />
        ))}
      </div>

      {editId !== null && (
        <BearbeitenModal
          ctx={ctx}
          platz={stellplaetze.find((p) => p.id === editId)}
          onClose={() => setEditId(null)}
          onSave={(patch) => { aktualisierePlatz(editId, patch); setEditId(null); }}
          onLeeren={() => { platzLeeren(editId); setEditId(null); }}
          onLoeschen={() => { stellplatzEntfernen(editId); setEditId(null); }}
        />
      )}

      {neuPlatzOffen && (
        <ConfirmDialog
          t={t}
          titel="Neuen Stellplatz anlegen"
          text={`Ein neuer, freier Stellplatz wird der Liste hinzugefügt (Nummer ${stellplaetze.length ? Math.max(...stellplaetze.map((p) => p.id)) + 1 : 1}).`}
          bestaetigenLabel="Anlegen"
          onCancel={() => setNeuPlatzOffen(false)}
          onConfirm={stellplatzHinzufuegen}
        />
      )}
    </div>
  );
}

function StellplatzKachel({ ctx, platz, onClick }) {
  const { t, stufenFarben } = ctx;
  const belegt = !!platz.kennzeichen;
  const tage = tageSeit(platz.eingangsdatum);
  const stufe = belegt ? standzeitStufe(tage) : "neutral";
  const c = stufenFarben[stufe];

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg p-3 transition-all hover:shadow-sm hover:-translate-y-0.5 border"
      style={{
        background: belegt ? t.panel : t.panelAlt,
        borderColor: belegt ? c.dot + "55" : t.border,
        borderStyle: belegt ? "solid" : "dashed",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium" style={{ color: t.textFaint }}>#{platz.id}</span>
        <span className="w-2 h-2 rounded-full" style={{ background: belegt ? c.dot : t.ringTrack }} title={belegt ? `${tage} Tage Standzeit` : "Frei"} />
      </div>
      {belegt ? (
        <div>
          <div className="font-mono font-semibold text-[13px] truncate">{platz.kennzeichen}</div>
          <div className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{platz.marke || "—"}</div>
        </div>
      ) : (
        <div className="text-[12px] py-1" style={{ color: t.textFaint }}>Frei</div>
      )}
    </button>
  );
}

/* ---------------- Fahrzeugliste ---------------- */

function ListeAnsicht({ ctx, stellplaetze, editId, setEditId, aktualisierePlatz, platzLeeren }) {
  const { t, stufenFarben } = ctx;
  const [filter, setFilter] = useState("alle");
  const [sortNach, setSortNach] = useState("id");

  const gefiltert = useMemo(() => {
    let liste = [...stellplaetze];
    if (filter === "belegt") liste = liste.filter((p) => p.kennzeichen);
    if (filter === "frei") liste = liste.filter((p) => !p.kennzeichen);
    if (filter === "kritisch") liste = liste.filter((p) => { const tg = tageSeit(p.eingangsdatum); return p.kennzeichen && tg !== null && tg >= SCHWELLE_GELB; });

    liste.sort((a, b) => {
      if (sortNach === "id") return a.id - b.id;
      if (sortNach === "kennzeichen") return (a.kennzeichen || "").localeCompare(b.kennzeichen || "");
      if (sortNach === "marke") return (a.marke || "").localeCompare(b.marke || "");
      if (sortNach === "standzeit") return (tageSeit(b.eingangsdatum) ?? -1) - (tageSeit(a.eingangsdatum) ?? -1);
      return 0;
    });
    return liste;
  }, [stellplaetze, filter, sortNach]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Fahrzeuge</h1>
          <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>{gefiltert.length} von {stellplaetze.length} Stellplätzen</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "alle", label: "Alle" },
            { key: "belegt", label: "Belegt" },
            { key: "frei", label: "Frei" },
            { key: "kritisch", label: "Kritisch" },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors"
                style={{
                  background: active ? t.accent : t.panel,
                  color: active ? t.accentText : t.textMuted,
                  borderColor: active ? t.accent : t.border,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ background: t.panel, borderColor: t.border }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: t.border, background: t.panelAlt }}>
              <Th t={t} onClick={() => setSortNach("id")} active={sortNach === "id"}>Platz</Th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: t.textMuted }}>Status</th>
              <Th t={t} onClick={() => setSortNach("kennzeichen")} active={sortNach === "kennzeichen"}>Kennzeichen</Th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: t.textMuted }}>VIN</th>
              <Th t={t} onClick={() => setSortNach("marke")} active={sortNach === "marke"}>Marke</Th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: t.textMuted }}>Eingangsdatum</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: t.textMuted }}>Kfz-Zulassung</th>
              <Th t={t} onClick={() => setSortNach("standzeit")} active={sortNach === "standzeit"}>Standzeit</Th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map((p) => {
              const belegt = !!p.kennzeichen;
              const tage = tageSeit(p.eingangsdatum);
              const stufe = belegt ? standzeitStufe(tage) : "neutral";
              const c = stufenFarben[stufe];
              const gruen = ctx.modus === "hell" ? "#0F7A50" : "#6FDCAE";
              return (
                <tr key={p.id} className="border-b last:border-0 transition-colors" style={{ borderColor: t.borderSoft }}>
                  <td className="px-4 py-2.5" style={{ color: t.textFaint }}>{p.id}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: belegt ? t.textMuted : gruen }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: belegt ? t.textFaint : gruen }} />
                      {belegt ? "Belegt" : "Frei"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-medium">{p.kennzeichen || "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]" style={{ color: t.textMuted }}>{p.vin || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: t.text }}>{p.marke || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: t.textMuted }}>{formatDatum(p.eingangsdatum)}</td>
                  <td className="px-4 py-2.5" style={{ color: t.textMuted }}>{formatDatum(p.zulassung)}</td>
                  <td className="px-4 py-2.5">
                    {belegt && tage !== null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium" style={{ background: c.bg, color: c.text }}>
                        {tage} Tage
                      </span>
                    ) : (
                      <span style={{ color: t.textFaint }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditId(p.id)} style={{ color: t.textFaint }} title="Bearbeiten">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {gefiltert.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[13px]" style={{ color: t.textFaint }}>
                  Keine Stellplätze in dieser Ansicht.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editId !== null && (
        <BearbeitenModal
          ctx={ctx}
          platz={stellplaetze.find((p) => p.id === editId)}
          onClose={() => setEditId(null)}
          onSave={(patch) => { aktualisierePlatz(editId, patch); setEditId(null); }}
          onLeeren={() => { platzLeeren(editId); setEditId(null); }}
        />
      )}
    </div>
  );
}

function Th({ t, children, onClick, active }) {
  return (
    <th onClick={onClick} className="text-left px-4 py-2.5 font-medium cursor-pointer select-none transition-colors" style={{ color: active ? t.text : t.textMuted }}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ChevronDown size={12} style={{ opacity: active ? 1 : 0 }} />
      </span>
    </th>
  );
}

/* ---------------- Bearbeiten-Modal ---------------- */

function BearbeitenModal({ ctx, platz, onClose, onSave, onLeeren, onLoeschen }) {
  const { t } = ctx;
  const [form, setForm] = useState(platz);
  const [zeigeLoeschBestaetigung, setZeigeLoeschBestaetigung] = useState(false);
  const ersteFeld = useRef(null);

  useEffect(() => { setForm(platz); }, [platz]);
  useEffect(() => { ersteFeld.current?.focus(); }, []);

  if (!platz) return null;

  function setFeld(feld, wert) { setForm((f) => ({ ...f, [feld]: wert })); }
  function speichern(e) { e.preventDefault(); onSave(form); }

  const belegt = !!platz.kennzeichen;
  const inputStyle = { background: t.inputBg, color: t.text, borderColor: t.border };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }} onMouseDown={onClose}>
        <div className="rounded-xl shadow-xl w-full max-w-md overflow-hidden border" style={{ background: t.panel, borderColor: t.border }} onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: t.borderSoft }}>
            <div>
              <div className="text-[15px] font-semibold">Stellplatz {platz.id}</div>
              <div className="text-[12px]" style={{ color: t.textFaint }}>{belegt ? "Belegt" : "Frei"}</div>
            </div>
            <button onClick={onClose} style={{ color: t.textFaint }}><X size={18} /></button>
          </div>

          <form onSubmit={speichern} className="px-5 py-4 space-y-3.5">
            <Feld t={t} label="Kennzeichen">
              <input
                ref={ersteFeld}
                value={form.kennzeichen}
                onChange={(e) => setFeld("kennzeichen", e.target.value.toUpperCase())}
                placeholder="z. B. B-AB 1234"
                className="w-full font-mono tracking-wide border rounded-lg px-3 py-2 text-[13px] outline-none"
                style={inputStyle}
              />
            </Feld>

            <Feld t={t} label="VIN">
              <input
                value={form.vin}
                onChange={(e) => setFeld("vin", e.target.value.toUpperCase())}
                placeholder="Fahrgestellnummer"
                maxLength={17}
                className="w-full font-mono text-[12.5px] tracking-wide border rounded-lg px-3 py-2 outline-none"
                style={inputStyle}
              />
            </Feld>

            <Feld t={t} label="Marke">
              <Select
  options={MARKEN.map((m) => ({
    value: m,
    label: m,
  }))}
  value={
    form.marke
      ? { value: form.marke, label: form.marke }
      : null
  }
  onChange={(option) =>
    setFeld("marke", option ? option.value : "")
  }
  placeholder="Marke auswählen..."
  isClearable
/>
            </Feld>

            <div className="grid grid-cols-2 gap-3">
              <Feld t={t} label="Eingangsdatum">
                <input type="date" value={form.eingangsdatum} onChange={(e) => setFeld("eingangsdatum", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-[13px] outline-none" style={inputStyle} />
              </Feld>
              <Feld t={t} label="Kfz-Zulassung">
                <input type="date" value={form.zulassung} onChange={(e) => setFeld("zulassung", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-[13px] outline-none" style={inputStyle} />
              </Feld>
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: t.borderSoft }}>
              <div className="flex items-center gap-3">
                {belegt && (
                  <button type="button" onClick={onLeeren} className="text-[12.5px] font-medium" style={{ color: t.textMuted }}>
                    Platz räumen
                  </button>
                )}
                {onLoeschen && (
                  <button type="button" onClick={() => setZeigeLoeschBestaetigung(true)} className="flex items-center gap-1 text-[12.5px] font-medium" style={{ color: "#E5495C" }}>
                    <Trash2 size={13} /> Entfernen
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="px-3.5 py-2 text-[13px] font-medium" style={{ color: t.textMuted }}>
                  Abbrechen
                </button>
                <button type="submit" className="px-4 py-2 text-[13px] font-medium rounded-lg" style={{ background: t.accent, color: t.accentText }}>
                  Speichern
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {zeigeLoeschBestaetigung && (
        <ConfirmDialog
          t={t}
          titel="Stellplatz entfernen?"
          text={`Stellplatz ${platz.id} wird dauerhaft aus dem Plan entfernt. Dies kann nicht rückgängig gemacht werden.`}
          bestaetigenLabel="Entfernen"
          gefahr
          onCancel={() => setZeigeLoeschBestaetigung(false)}
          onConfirm={onLoeschen}
        />
      )}
    </>
  );
}

function Feld({ t, label, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium mb-1" style={{ color: t.textMuted }}>{label}</span>
      {children}
    </label>
  );
}

function ConfirmDialog({ t, titel, text, bestaetigenLabel, gefahr, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)" }} onMouseDown={onCancel}>
      <div className="rounded-xl shadow-xl w-full max-w-sm p-5 border" style={{ background: t.panel, borderColor: t.border }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="text-[15px] font-semibold">{titel}</div>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: t.textMuted }}>{text}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3.5 py-2 text-[13px] font-medium" style={{ color: t.textMuted }}>
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[13px] font-medium rounded-lg text-white"
            style={{ background: gefahr ? "#DC2626" : t.accent, color: gefahr ? "#fff" : t.accentText }}
          >
            {bestaetigenLabel}
          </button>
        </div>
      </div>
    </div>
  );
}