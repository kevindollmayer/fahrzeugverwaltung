import React, { useState } from "react";
import { BENZIN_IM_BLUT } from "./benzinImBlut";

export default function BenzinImBlutKachel({ t }) {
  const [fakt, setFakt] = useState(
    BENZIN_IM_BLUT[Math.floor(Math.random() * BENZIN_IM_BLUT.length)]
  );

  function neuerFakt() {
    let neu;

    do {
      neu =
        BENZIN_IM_BLUT[
          Math.floor(Math.random() * BENZIN_IM_BLUT.length)
        ];
    } while (
      BENZIN_IM_BLUT.length > 1 &&
      neu.id === fakt.id
    );

    setFakt(neu);
  }

  return (
    <div
      className="rounded-xl p-5 border flex flex-col justify-between"
      style={{
        background: t.panel,
        borderColor: t.border,
        minHeight: 260,
      }}
    >
      <div>
        <div
  className="text-[24px] font-black text-center tracking-tight"
  style={{
    color: t.text,
    fontFamily: "Inter, Poppins, ui-sans-serif, sans-serif",
  }}
>
  ⛽ BL Fakt des Tages
</div>

<div
  className="mt-2 mb-6 text-[14px] text-center"
  style={{
    color: t.textMuted,
    fontFamily: "Inter, Poppins, ui-sans-serif, sans-serif",
  }}
>
  Heute schon was gelernt?
</div>

        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 18,
            lineHeight: 1.6,
            color: t.text,
          }}
        >
          ❝ {fakt.text} ❞
        </div>
      </div>

      <div className="mt-5">
        <div
          className="flex justify-between text-[12px] mb-4"
          style={{ color: t.textFaint }}
        >
          <span>{fakt.typ}</span>
          <span>{fakt.marke}</span>
        </div>

        <button
          onClick={neuerFakt}
          className="px-3 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background: t.accent,
            color: t.accentText,
          }}
        >
          🎲 Neuer Fakt
        </button>
      </div>
    </div>
  );
}