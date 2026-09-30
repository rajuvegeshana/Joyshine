/* ===========================================================
   THEME KIT — what makes each look a place rather than a
   palette. Every theme brings its own motif drifting behind
   the page, its own accessory on the unicorn, its own accent
   icon and its own line of atmosphere.

   All of it is decoration: aria-hidden, pointer-events none,
   and still under prefers-reduced-motion. The motion lives in
   assets/css/character.css, keyed off data-theme.
   =========================================================== */
window.KIT = (() => {
'use strict';

/* a motif is one small shape, repeated and drifted by CSS.
   an accessory is drawn on the 200x200 hero unicorn.
   the spark is the accent icon in buttons and empty states. */
const K = {

  clay: {
    note: 'Pressed soft, printed slow',
    hud: 'Nova bust',
    count: 9,
    motif: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="var(--art-2)" opacity=".5"/><circle cx="14" cy="14" r="5" fill="var(--sheen)" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5L10 13l-6.5-2L10 9z"/></svg>',
    acc: '<g class="acc"><ellipse cx="88" cy="70" rx="7" ry="5" fill="var(--art-3)" opacity=".9"/><circle cx="88" cy="70" r="2.2" fill="var(--art-4)" opacity=".5"/><path d="M78 66q4-6 10-4" stroke="var(--art-3)" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/></g>',
  },

  retro: {
    note: 'Airbrushed and chrome trimmed',
    hud: 'Sunset badge',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 3 24 16l13 4-13 4-4 13-4-13-13-4 13-4z" fill="var(--art-3)" opacity=".75"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 15 9.2 22.5 10l-5.6 5 1.7 7.4L12 18.6 5.4 22.4 7.1 15 1.5 10l7.5-.8z"/></svg>',
    acc: '<g class="acc"><path d="M74 96h30" stroke="var(--art-4)" stroke-width="7" stroke-linecap="round" opacity=".85"/><circle cx="82" cy="96" r="7" fill="var(--art-4)"/><circle cx="82" cy="96" r="2.4" fill="var(--art-3)"/><circle cx="102" cy="96" r="7" fill="var(--art-4)"/><circle cx="102" cy="96" r="2.4" fill="var(--art-3)"/><path d="M60 168h18l-4 10H64z" fill="var(--art-3)"/><circle cx="66" cy="180" r="4" fill="var(--art-4)"/><circle cx="78" cy="180" r="4" fill="var(--art-4)"/></g>',
  },

  future: {
    note: 'Calibrated to 0.05 mm',
    hud: 'Bracket v4',
    count: 12,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 4 34 12v16l-14 8-14-8V12z" fill="none" stroke="var(--grid)" stroke-width="2"/><circle cx="20" cy="20" r="2.5" fill="var(--art-2)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.6 20 7v10l-8 4.4L4 17V7z"/><path d="M12 8.4 16 10.6v4.8L12 17.6 8 15.4v-4.8z" fill="currentColor" stroke="none" opacity=".55"/></svg>',
    acc: '<g class="acc"><path d="M72 92h40" stroke="var(--art-3)" stroke-width="3" stroke-linecap="round" opacity=".9"/><rect x="72" y="86" width="40" height="13" rx="4" fill="var(--art-3)" opacity=".22"/><path d="M52 58h10M52 58v10M148 58h-10M148 58v10M52 150h10M52 150v-10M148 150h-10M148 150v-10" stroke="var(--art-3)" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/></g>',
  },

  halloween: {
    note: 'Spooky, but make it pastel',
    hud: 'Pumpkin lamp',
    count: 9,
    motif: '<svg viewBox="0 0 40 40"><path d="M4 22q6-8 8 0 4-5 8 0 4-5 8 0 2-8 8 0-6 8-16 8T4 22z" fill="var(--art-4)" opacity=".55"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12q4-5 5 0 2.5-3.2 5 0 2.5-3.2 5 0 1-5 5 0-3.6 5-10 5T2 12z"/></svg>',
    acc: '<g class="acc"><path d="M84 46h28l-6 16H90z" fill="var(--art-4)" opacity=".92"/><path d="M78 62h40" stroke="var(--art-4)" stroke-width="5" stroke-linecap="round"/><path d="M88 60h20" stroke="var(--art-2)" stroke-width="4" stroke-linecap="round"/><g><ellipse cx="46" cy="166" rx="16" ry="13" fill="var(--art-1)"/><path d="M46 153v-6" stroke="var(--art-3)" stroke-width="3.4" stroke-linecap="round"/><path d="M40 163l4 4-4 3M52 163l-4 4 4 3" stroke="var(--art-4)" stroke-width="2.4" fill="none" stroke-linecap="round"/></g></g>',
  },

  diwali: {
    note: 'Lamps lit, rangoli drawn',
    hud: 'Diya set',
    count: 11,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 6q7 9 7 14a7 7 0 0 1-14 0c0-5 7-14 7-14z" fill="var(--art-3)" opacity=".85"/><path d="M20 14q3 4 3 6a3 3 0 0 1-6 0c0-2 3-6 3-6z" fill="var(--art-1)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2q7 9 7 14a7 7 0 0 1-14 0c0-5 7-14 7-14z"/></svg>',
    acc: '<g class="acc"><path d="M34 170q10 8 22 0-2 10-11 10t-11-10z" fill="var(--art-3)"/><path d="M45 160q3 5 3 7a3 3 0 0 1-6 0c0-2 3-7 3-7z" fill="var(--art-1)"/><circle cx="100" cy="42" r="26" fill="none" stroke="var(--art-3)" stroke-width="2" opacity=".5" stroke-dasharray="4 7"/><path d="M118 74l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--art-3)" opacity=".9"/></g>',
  },

  holi: {
    note: 'Colour on everything',
    hud: 'Powder pots',
    count: 14,
    motif: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="11" fill="var(--art-2)" opacity=".8"/><circle cx="30" cy="12" r="4" fill="var(--art-3)" opacity=".85"/><circle cx="11" cy="28" r="3" fill="var(--art-1)" opacity=".85"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="10" cy="13" r="6"/><circle cx="18" cy="7" r="3"/><circle cx="6" cy="5" r="2.2"/><circle cx="19" cy="18" r="2.2"/></svg>',
    acc: '<g class="acc"><circle cx="86" cy="118" r="9" fill="var(--art-3)" opacity=".8"/><circle cx="118" cy="132" r="6" fill="var(--art-2)" opacity=".8"/><circle cx="76" cy="140" r="5" fill="var(--art-1)" opacity=".8"/><circle cx="128" cy="104" r="4" fill="var(--art-3)" opacity=".7"/><path d="M150 150l16-10" stroke="var(--art-2)" stroke-width="7" stroke-linecap="round"/><circle cx="170" cy="138" r="7" fill="var(--art-3)"/></g>',
  },

  christmas: {
    note: 'Snow on the print bed',
    hud: 'Tree topper',
    count: 14,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 4v32M6 12l28 16M34 12 6 28" stroke="var(--sheen)" stroke-width="3" stroke-linecap="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.4 7 20.6 17M20.6 7 3.4 17"/></svg>',
    acc: '<g class="acc"><path d="M86 56q16-14 28-2l-4 12H90z" fill="var(--art-2)"/><path d="M82 66h34" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".92"/><circle cx="118" cy="56" r="6" fill="#fff" opacity=".92"/><path d="M70 126q18 8 34 0" stroke="var(--art-2)" stroke-width="9" fill="none" stroke-linecap="round"/></g>',
  },

  navratri: {
    note: 'Nine nights, nine colours',
    hud: 'Dandiya pair',
    count: 12,
    motif: '<svg viewBox="0 0 40 40"><rect x="18" y="4" width="4" height="32" rx="2" fill="var(--art-3)"/><circle cx="20" cy="6" r="4" fill="var(--art-2)"/><circle cx="20" cy="34" r="4" fill="var(--art-1)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="10.5" y="3" width="3" height="18" rx="1.5"/><circle cx="12" cy="3.4" r="2.6"/><circle cx="12" cy="20.6" r="2.6"/></svg>',
    acc: '<g class="acc"><path d="M74 118q26 16 52 0l-6 34H80z" fill="var(--art-2)" opacity=".55"/><path d="M78 118q24 14 48 0" stroke="var(--art-3)" stroke-width="3" fill="none"/><rect x="152" y="96" width="5" height="40" rx="2.5" fill="var(--art-3)" transform="rotate(18 154 116)"/><rect x="164" y="96" width="5" height="40" rx="2.5" fill="var(--art-1)" transform="rotate(-18 166 116)"/></g>',
  },

  ganesh: {
    note: 'Modaks on the print bed',
    hud: 'Modak tray',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 5c7 8 12 15 12 20a12 12 0 0 1-24 0c0-5 5-12 12-20z" fill="var(--art-3)" opacity=".8"/><path d="M8 27h24" stroke="var(--art-4)" stroke-width="2" opacity=".3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5 6 8 10 8 14a8 8 0 1 1-16 0c0-4 3-8 8-14z"/></svg>',
    acc: '<g class="acc"><path d="M46 150c5 6 8 10 8 13a8 8 0 0 1-16 0c0-3 3-7 8-13z" fill="var(--art-3)"/><path d="M36 172h20" stroke="var(--art-4)" stroke-width="2.6" stroke-linecap="round" opacity=".5"/><path d="M100 36q10 8 0 16-10-8 0-16z" fill="var(--art-2)" opacity=".8"/><path d="M92 40q-12 4-12 12M108 40q12 4 12 12" stroke="var(--art-3)" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></g>',
  },

  krishna: {
    note: 'Feather, flute and butter',
    hud: 'Flute charm',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 38V14" stroke="var(--art-3)" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="20" cy="12" rx="8" ry="11" fill="var(--art-2)" opacity=".75"/><ellipse cx="20" cy="11" rx="3.4" ry="4.6" fill="var(--art-3)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="8" rx="5.4" ry="7"/><path d="M12 22V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    acc: '<g class="acc"><ellipse cx="112" cy="40" rx="7" ry="10" fill="var(--art-2)" opacity=".85" transform="rotate(18 112 40)"/><ellipse cx="112" cy="38" rx="3" ry="4.2" fill="var(--art-3)" transform="rotate(18 112 38)"/><path d="M118 52 106 62" stroke="var(--art-3)" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><rect x="128" y="140" width="44" height="6" rx="3" fill="var(--art-3)" transform="rotate(-12 150 143)"/><circle cx="140" cy="146" r="1.8" fill="var(--art-4)"/><circle cx="150" cy="144" r="1.8" fill="var(--art-4)"/><circle cx="160" cy="142" r="1.8" fill="var(--art-4)"/></g>',
  },

  tiranga: {
    note: 'Saffron, white and green',
    hud: 'Chakra badge',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><rect x="4" y="10" width="32" height="6" rx="3" fill="var(--art-1)"/><rect x="4" y="18" width="32" height="6" rx="3" fill="var(--sheen)"/><rect x="4" y="26" width="32" height="6" rx="3" fill="var(--art-2)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 3.6v16.8M3.6 12h16.8M6 6l12 12M18 6 6 18"/></svg>',
    acc: '<g class="acc"><path d="M74 104q26 14 52 2l4 12q-30 14-58 0z" fill="var(--art-1)" opacity=".8"/><path d="M74 116q26 14 52 2l3 9q-28 13-54 0z" fill="var(--art-2)" opacity=".75"/><circle cx="100" cy="118" r="8" fill="none" stroke="var(--art-4)" stroke-width="2" opacity=".8"/><path d="M100 110v16M92 118h16M94.3 112.3l11.4 11.4M105.7 112.3l-11.4 11.4" stroke="var(--art-4)" stroke-width="1.4" opacity=".6"/></g>',
  },

  /* ---- Valentine's week: seven days, seven rooms --------- */

  rose: {
    note: 'Petals on the print bed',
    hud: 'Rose stem',
    count: 12,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 4q14 6 14 18T20 36 6 22 20 4z" fill="var(--art-2)" opacity=".75"/><path d="M20 8q9 6 9 14t-9 10z" fill="var(--art-1)" opacity=".6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2q9 4 9 11a9 9 0 0 1-18 0c0-7 9-11 9-11z"/></svg>',
    acc: '<g class="acc"><path d="M150 96q12 2 14 14t-12 16q-10-4-10-16z" fill="var(--art-2)" opacity=".9"/><path d="M152 126v22" stroke="var(--art-3)" stroke-width="3" stroke-linecap="round"/><path d="M152 134q-10-2-12-10 10-1 12 6z" fill="var(--art-3)"/><path d="M96 74q6-8 14-4" stroke="var(--art-2)" stroke-width="3" fill="none" stroke-linecap="round"/></g>',
  },

  propose: {
    note: 'On one knee, nicely finished',
    hud: 'Ring box',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><circle cx="20" cy="24" r="10" fill="none" stroke="var(--art-1)" stroke-width="3"/><path d="M20 6l3.4 6H16.6z" fill="var(--art-3)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="15" r="6"/><path d="M12 3l3 4.4H9z" fill="currentColor" stroke="none"/></svg>',
    acc: '<g class="acc"><rect x="126" y="150" width="36" height="24" rx="5" fill="var(--art-4)" opacity=".85"/><path d="M126 156h36" stroke="var(--art-3)" stroke-width="2" opacity=".6"/><circle cx="144" cy="142" r="8" fill="none" stroke="var(--art-1)" stroke-width="3"/><path d="M144 126l4 7h-8z" fill="var(--art-3)"/><path d="M104 60l2.6 6 6 2.6-6 2.6-2.6 6-2.6-6-6-2.6 6-2.6z" fill="var(--art-3)" opacity=".85"/></g>',
  },

  chocolate: {
    note: 'Cocoa, caramel and cream',
    hud: 'Truffle box',
    count: 11,
    motif: '<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="4" fill="var(--art-2)"/><path d="M20 6v28M6 20h28" stroke="var(--art-4)" stroke-width="2" opacity=".45"/><rect x="9" y="9" width="8" height="8" rx="2" fill="var(--art-1)" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 3v18M3 12h18" stroke="var(--brand-ink, #fff)" stroke-width="1.6" opacity=".5"/></svg>',
    acc: '<g class="acc"><rect x="120" y="146" width="44" height="28" rx="5" fill="var(--art-2)"/><path d="M120 156h44M142 146v28" stroke="var(--art-4)" stroke-width="2.4" opacity=".5"/><path d="M92 66q10-6 18 0" stroke="var(--art-3)" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="118" cy="120" r="5" fill="var(--art-3)" opacity=".8"/></g>',
  },

  teddy: {
    note: 'Soft, stuffed and printed',
    hud: 'Teddy set',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><circle cx="20" cy="24" r="9" fill="var(--art-1)" opacity=".8"/><circle cx="11" cy="13" r="4" fill="var(--art-1)" opacity=".7"/><circle cx="20" cy="10" r="4" fill="var(--art-1)" opacity=".7"/><circle cx="29" cy="13" r="4" fill="var(--art-1)" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="15" r="6"/><circle cx="6" cy="7" r="2.8"/><circle cx="12" cy="5" r="2.8"/><circle cx="18" cy="7" r="2.8"/></svg>',
    acc: '<g class="acc"><circle cx="46" cy="162" r="15" fill="var(--art-1)"/><circle cx="36" cy="149" r="6" fill="var(--art-1)"/><circle cx="56" cy="149" r="6" fill="var(--art-1)"/><circle cx="41" cy="160" r="2" fill="var(--art-4)"/><circle cx="51" cy="160" r="2" fill="var(--art-4)"/><ellipse cx="46" cy="167" rx="5" ry="4" fill="var(--art-3)"/><path d="M84 62q8-10 18-4" stroke="var(--art-2)" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/></g>',
  },

  promise: {
    note: 'Written down and kept',
    hud: 'Knot charm',
    count: 10,
    motif: '<svg viewBox="0 0 40 40"><path d="M10 26q10-16 20 0" stroke="var(--art-1)" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="10" cy="26" r="3.4" fill="var(--art-2)"/><circle cx="30" cy="26" r="3.4" fill="var(--art-2)"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15q6-10 12 0"/><circle cx="6" cy="15" r="2.2" fill="currentColor"/><circle cx="18" cy="15" r="2.2" fill="currentColor"/></svg>',
    acc: '<g class="acc"><path d="M132 140q14-18 28 0" stroke="var(--art-1)" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="132" cy="140" r="4.4" fill="var(--art-2)"/><circle cx="160" cy="140" r="4.4" fill="var(--art-2)"/><path d="M78 60h28" stroke="var(--art-3)" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>',
  },

  hug: {
    note: 'Arms out, printer warm',
    hud: 'Round plush',
    count: 9,
    motif: '<svg viewBox="0 0 40 40"><path d="M6 24q6-12 14-4 8-8 14 4-7 12-14 12T6 24z" fill="var(--art-2)" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 13q4-8 10-3 6-5 10 3-5 8-10 8T2 13z"/></svg>',
    acc: '<g class="acc"><path d="M58 118q-16 10-10 30" stroke="var(--art-1)" stroke-width="11" fill="none" stroke-linecap="round" opacity=".85"/><path d="M148 110q18 8 12 30" stroke="var(--art-1)" stroke-width="11" fill="none" stroke-linecap="round" opacity=".85"/><path d="M92 70q10-8 18-2" stroke="var(--art-3)" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/></g>',
  },

  kiss: {
    note: 'Sealed with one',
    hud: 'Lip charm',
    count: 12,
    motif: '<svg viewBox="0 0 40 40"><path d="M6 18q7-9 14-2 7-7 14 2-6 14-14 14T6 18z" fill="var(--art-1)"/><path d="M8 19h24" stroke="var(--art-4)" stroke-width="1.6" opacity=".4"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 9q6-7 10-1 4-6 10 1-5 11-10 11T2 9z"/></svg>',
    acc: '<g class="acc"><path d="M128 94q6-7 11-1 5-6 11 1-5 10-11 10t-11-10z" fill="var(--art-1)" opacity=".92"/><path d="M96 78q9-7 16-1" stroke="var(--art-1)" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M52 150l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--art-3)"/></g>',
  },

  valentine: {
    note: 'Hearts wherever they fit',
    hud: 'Heart plaque',
    count: 13,
    motif: '<svg viewBox="0 0 40 40"><path d="M20 34S5 24 5 15a7.4 7.4 0 0 1 15-4 7.4 7.4 0 0 1 15 4c0 9-15 19-15 19z" fill="var(--art-1)" opacity=".8"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21S3 15.4 3 9.8A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 9 2.8C21 15.4 12 21 12 21z"/></svg>',
    acc: '<g class="acc"><path d="M44 172s-14-9-14-17a6.9 6.9 0 0 1 14-3.6 6.9 6.9 0 0 1 14 3.6c0 8-14 17-14 17z" fill="var(--art-1)"/><path d="M112 58s-9-6-9-11a4.4 4.4 0 0 1 9-2.4 4.4 4.4 0 0 1 9 2.4c0 5-9 11-9 11z" fill="var(--art-3)" opacity=".9"/><path d="M92 76q10-8 18-2" stroke="var(--art-1)" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".8"/></g>',
  },
};

/* fixed scatter — deterministic, so nothing jumps between paints */
const SPOTS = [
  [6, 12, 1.0, 0], [22, 68, .7, 1.4], [38, 26, 1.2, 3.1], [54, 80, .8, .6],
  [70, 18, 1.1, 2.3], [86, 58, .9, 4.2], [14, 44, .6, 5.1], [46, 6, .75, 1.9],
  [62, 46, 1.05, 3.7], [92, 30, .65, .9], [30, 92, .95, 2.7], [78, 86, .7, 4.8],
  [10, 74, .85, 3.3], [50, 34, .6, 5.6],
];

function motifLayer(theme, k) {
  const box = document.getElementById('motif');
  if (!box || box.dataset.on === theme) return;
  box.dataset.on = theme;
  box.innerHTML = SPOTS.slice(0, k.count || 10).map(([x, y, s, d], i) =>
    `<i style="left:${x}%;top:${y}%;--s:${s};--d:${d}s;--n:${i}">${k.motif}</i>`).join('');
}

function accessory(theme, k) {
  const build = document.querySelector('.printer__art svg .build');
  if (!build) return;
  if (build.dataset.acc === theme) return;
  build.dataset.acc = theme;
  build.querySelector('.acc')?.remove();
  if (!k.acc) return;
  build.insertAdjacentHTML('beforeend', k.acc);
}

/* the accent icon, for whoever asks before a paint has happened */
const spark = theme => (K[theme] || K.clay).spark;

function apply(theme) {
  const k = K[theme] || K.clay;
  motifLayer(theme, k);
  accessory(theme, k);
  document.querySelectorAll('[data-spark]').forEach(e => { e.innerHTML = k.spark; });
  document.querySelectorAll('[data-themenote]').forEach(e => { e.textContent = k.note; });
  document.querySelectorAll('[data-hud]').forEach(e => { e.textContent = k.hud; });
}

return { apply, spark, themes: K };
})();
