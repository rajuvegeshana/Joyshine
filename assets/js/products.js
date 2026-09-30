/* ============================================================
   CATALOGUE — categories, shared variants, product art, products.

   Art is inline SVG so there are zero image files to host and
   every product recolours itself with the theme and with the
   colour variant the customer picks.
   To use a photo instead, add  photo: 'assets/img/foo.jpg'
   to a product; it wins over the drawn art.
   ============================================================ */

/* ---------- categories ------------------------------------- */
window.CATEGORIES = [
  { id: 'home',     name: 'Home & Living',  note: 'Decor, organisers, things that earn their shelf.' },
  { id: 'puja',     name: 'Puja & Spiritual', note: 'Kumkum barni, diya stands, festival decor.' },
  { id: 'desk',     name: 'Desk & Office',  note: 'Organisers, stands, cable wrangling.' },
  { id: 'kids',     name: 'Kids',           note: 'Toys, animals, puzzles, small adventures.' },
  { id: 'gifts',    name: 'Gifts',          note: 'Birthdays, return gifts, festivals, corporate.' },
  { id: 'keys',     name: 'Keychains',      note: 'Animals, characters, your name.' },
  { id: 'light',    name: 'Lighting',       note: 'Lamps and ambient light, printed thin.' },
  { id: 'custom',   name: 'Custom',         note: 'Your name, your design, your STL.' },
];

/* ---------- shared variant options -------------------------- */
const SIZES = [
  { k: 'S',  label: 'Small',  delta: -150, dim: 'approx. 60 mm' },
  { k: 'M',  label: 'Medium', delta: 0,    dim: 'approx. 90 mm' },
  { k: 'L',  label: 'Large',  delta: 250,  dim: 'approx. 130 mm' },
  { k: 'XL', label: 'X-Large',delta: 550,  dim: 'approx. 180 mm' },
];
const MATERIALS = [
  { k: 'PLA',  label: 'PLA',  delta: 0,   note: 'Plant-derived, matte finish. Indoor use.' },
  { k: 'PGLA', label: 'PGLA', delta: 120, note: 'Tougher and glossier than PLA.' },
  { k: 'ABS',  label: 'ABS',  delta: 220, note: 'Heat-tolerant. Best where it gets handled.' },
];
const COLOURS = [
  { k: 'white',  label: 'Pearl white', hex: '#f4f1ea' },
  { k: 'pink',   label: 'Blush pink',  hex: '#ff9fc4' },
  { k: 'lilac',  label: 'Lilac',       hex: '#b79bff' },
  { k: 'yellow', label: 'Marigold',    hex: '#ffc93d' },
  { k: 'green',  label: 'Sage',        hex: '#8fd6b4' },
  { k: 'blue',   label: 'Sky',         hex: '#7fc4ff' },
  { k: 'gold',   label: 'Antique gold',hex: '#d4a13c' },
  { k: 'black',  label: 'Matte black', hex: '#4a4458' },
];
window.VARIANT_OPTIONS = { SIZES, MATERIALS, COLOURS };

/* ---------- drawing helpers -------------------------------- */
const base = (r = 62) => `<ellipse cx="100" cy="176" rx="${r}" ry="9" fill="var(--art-4)" opacity=".22"/>`;
const lay = (x, y, w, h, r = 6) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#layerlines)" opacity=".5"/>`;
const horn = (x, y, h = 48, w = 20) =>
  `<path d="M${x} ${y} L${x + w / 2} ${y - h} L${x + w} ${y}z" fill="var(--art-3)"/>`;

const ART = {

  /* --- lighting ------------------------------------------- */
  lamp: `${base()}
    <circle cx="100" cy="86" r="48" fill="var(--art-glow)" opacity=".55"/>
    <path d="M100 40c-26 0-42 18-42 42 0 20 12 33 22 40h40c10-7 22-20 22-40 0-24-16-42-42-42z" fill="var(--art-1)"/>
    ${horn(89, 40, 28, 22)}
    <circle cx="86" cy="84" r="4" fill="var(--art-4)"/><circle cx="114" cy="84" r="4" fill="var(--art-4)"/>
    <path d="M92 100q8 7 16 0" stroke="var(--art-4)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="76" y="122" width="48" height="10" rx="5" fill="var(--art-4)" opacity=".7"/>
    <rect x="66" y="132" width="68" height="34" rx="12" fill="var(--art-2)"/>
    ${lay(58, 40, 84, 126, 22)}`,

  moon: `${base(52)}
    <circle cx="100" cy="82" r="50" fill="var(--art-glow)" opacity=".5"/>
    <circle cx="100" cy="82" r="42" fill="var(--art-1)"/>
    <circle cx="84" cy="70" r="7" fill="var(--art-4)" opacity=".18"/>
    <circle cx="112" cy="94" r="10" fill="var(--art-4)" opacity=".15"/>
    <circle cx="116" cy="64" r="5" fill="var(--art-4)" opacity=".18"/>
    <path d="M70 132h60l-8 34H78z" fill="var(--art-2)"/>
    ${lay(58, 40, 84, 126, 26)}`,

  cloud: `${base(50)}
    <circle cx="100" cy="88" r="46" fill="var(--art-glow)" opacity=".45"/>
    <path d="M62 104q-14 0-14-14t16-14q2-20 22-20t24 16q18-2 22 12t-12 20z" fill="var(--art-1)"/>
    <path d="M78 112l-6 22M100 114l-6 26M122 112l-6 22" stroke="var(--art-3)" stroke-width="5" stroke-linecap="round"/>
    <rect x="86" y="146" width="28" height="20" rx="6" fill="var(--art-2)"/>
    ${lay(48, 56, 104, 58, 24)}`,

  /* --- puja ------------------------------------------------ */
  barni: `${base(54)}
    <path d="M62 84h76l-8 82H70z" fill="var(--art-1)"/>
    ${lay(62, 84, 76, 82, 10)}
    <rect x="54" y="72" width="92" height="16" rx="8" fill="var(--art-2)"/>
    <path d="M70 72q6-26 30-26t30 26z" fill="var(--art-2)"/>
    <circle cx="100" cy="40" r="9" fill="var(--art-3)"/>
    <path d="M78 110h44M82 128h36" stroke="var(--art-4)" stroke-width="4" stroke-linecap="round" opacity=".35"/>`,

  diya: `${base(56)}
    <path d="M100 52q-9 18 0 26 9-8 0-26z" fill="var(--art-3)"/>
    <ellipse cx="100" cy="86" rx="8" ry="5" fill="var(--art-4)" opacity=".4"/>
    <path d="M52 96h96q-6 46-48 46T52 96z" fill="var(--art-1)"/>
    ${lay(52, 96, 96, 46, 16)}
    <rect x="72" y="144" width="56" height="22" rx="8" fill="var(--art-2)"/>
    <path d="M64 108h72" stroke="var(--art-4)" stroke-width="4" stroke-linecap="round" opacity=".3"/>`,

  agarbatti: `${base(48)}
    <path d="M86 30v54M100 22v62M114 30v54" stroke="var(--art-3)" stroke-width="4" stroke-linecap="round"/>
    <circle cx="86" cy="28" r="4" fill="var(--art-2)"/><circle cx="100" cy="20" r="4" fill="var(--art-2)"/><circle cx="114" cy="28" r="4" fill="var(--art-2)"/>
    <path d="M58 92h84l-10 74H68z" fill="var(--art-1)"/>
    ${lay(58, 92, 84, 74, 12)}
    <rect x="50" y="84" width="100" height="14" rx="7" fill="var(--art-2)"/>
    <circle cx="100" cy="128" r="12" fill="var(--art-4)" opacity=".28"/>`,

  bell: `${base(46)}
    <rect x="94" y="22" width="12" height="20" rx="6" fill="var(--art-3)"/>
    <path d="M60 130q0-56 40-56t40 56z" fill="var(--art-1)"/>
    ${lay(60, 74, 80, 56, 20)}
    <rect x="52" y="128" width="96" height="14" rx="7" fill="var(--art-2)"/>
    <circle cx="100" cy="156" r="11" fill="var(--art-3)"/>`,

  toran: `<path d="M20 34h160" stroke="var(--art-4)" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <g fill="var(--art-1)">
      <path d="M36 36h28l-14 44zM86 36h28l-14 56zM136 36h28l-14 44z"/>
    </g>
    <g fill="var(--art-2)">
      <path d="M60 36h28l-14 52zM112 36h28l-14 52z"/>
    </g>
    <g fill="var(--art-3)">
      <circle cx="50" cy="88" r="6"/><circle cx="74" cy="96" r="6"/><circle cx="100" cy="100" r="7"/>
      <circle cx="126" cy="96" r="6"/><circle cx="150" cy="88" r="6"/>
    </g>
    ${lay(36, 36, 128, 60, 6)}`,

  /* --- home ------------------------------------------------ */
  planter: `${base()}
    <path d="M70 46q10-22 30-10M100 40q6-26 26-20" stroke="var(--art-2)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="68" cy="42" r="9" fill="var(--art-3)"/><circle cx="128" cy="24" r="9" fill="var(--art-3)"/>
    <path d="M56 70h88l-10 96H66z" fill="var(--art-1)"/>
    ${lay(56, 70, 88, 96, 10)}
    <rect x="50" y="60" width="100" height="16" rx="8" fill="var(--art-2)"/>
    <circle cx="82" cy="110" r="5" fill="var(--art-4)"/><circle cx="118" cy="110" r="5" fill="var(--art-4)"/>
    <path d="M88 126q12 10 24 0" stroke="var(--art-4)" stroke-width="4" fill="none" stroke-linecap="round"/>`,

  bookends: `${base(64)}
    <path d="M36 166V78h20v70h44v18z" fill="var(--art-1)"/>${lay(36, 78, 64, 88, 6)}
    <path d="M164 166V78h-20v70h-44v18z" fill="var(--art-2)"/>${lay(100, 78, 64, 88, 6)}
    ${horn(46, 78, 46, 18)}${horn(136, 78, 46, 18)}
    <rect x="72" y="96" width="56" height="52" rx="4" fill="var(--art-4)" opacity=".38"/>`,

  tray: `${base(64)}
    <path d="M40 104h120l-12 58H52z" fill="var(--art-1)"/>
    ${lay(40, 104, 120, 58, 12)}
    <path d="M40 104q30-40 60-40t60 40z" fill="var(--art-2)" opacity=".55"/>
    <circle cx="100" cy="86" r="10" fill="var(--art-3)"/>
    <circle cx="72" cy="96" r="5" fill="var(--art-3)" opacity=".7"/><circle cx="128" cy="96" r="5" fill="var(--art-3)" opacity=".7"/>`,

  vase: `${base(46)}
    <path d="M78 40h44l-6 34q26 22 26 52t-42 40q-42-10-42-40t26-52z" fill="var(--art-1)"/>
    ${lay(64, 40, 72, 126, 22)}
    <rect x="72" y="32" width="56" height="14" rx="7" fill="var(--art-2)"/>
    <path d="M100 32V10M100 18l14-10M100 18 86 8" stroke="var(--art-3)" stroke-width="5" stroke-linecap="round" fill="none"/>`,

  hooks: `<rect x="30" y="52" width="140" height="34" rx="12" fill="var(--art-1)"/>
    ${lay(30, 52, 140, 34, 12)}
    <g fill="var(--art-2)">
      <path d="M56 86h16v34q0 14-14 14t-14-14h16z"/><path d="M92 86h16v34q0 14-14 14t-14-14h16z"/>
      <path d="M128 86h16v34q0 14-14 14t-14-14h16z"/>
    </g>
    <circle cx="44" cy="69" r="5" fill="var(--art-3)"/><circle cx="156" cy="69" r="5" fill="var(--art-3)"/>`,

  /* --- desk ------------------------------------------------ */
  organizer: `${base(64)}
    <path d="M58 20l8 40M100 14v44M142 20l-8 40" stroke="var(--art-3)" stroke-width="7" stroke-linecap="round"/>
    <rect x="44" y="60" width="112" height="106" rx="14" fill="var(--art-1)"/>
    ${lay(44, 60, 112, 106, 14)}
    <rect x="56" y="74" width="40" height="80" rx="8" fill="var(--art-4)" opacity=".5"/>
    <rect x="104" y="74" width="40" height="36" rx="8" fill="var(--art-4)" opacity=".5"/>
    <rect x="104" y="118" width="40" height="36" rx="8" fill="var(--art-2)" opacity=".85"/>`,

  stand: `${base(58)}
    <path d="M44 166h112l-18-34H62z" fill="var(--art-4)" opacity=".75"/>
    <path d="M62 132h76L110 46H90z" fill="var(--art-1)"/>
    ${lay(62, 46, 76, 86, 8)}
    <path d="M118 52q26 6 26 34t-26 34" stroke="var(--art-2)" stroke-width="11" fill="none" stroke-linecap="round"/>
    ${horn(90, 46, 22, 20)}
    <rect x="56" y="158" width="88" height="10" rx="5" fill="var(--art-2)"/>`,

  penpot: `${base(48)}
    <path d="M70 26v46M86 18v54M100 30v42M116 20v52M130 28v44" stroke="var(--art-3)" stroke-width="6" stroke-linecap="round"/>
    <path d="M60 74h80l-8 92H68z" fill="var(--art-1)"/>
    ${lay(60, 74, 80, 92, 12)}
    <rect x="52" y="66" width="96" height="14" rx="7" fill="var(--art-2)"/>
    <circle cx="86" cy="116" r="4" fill="var(--art-4)"/><circle cx="114" cy="116" r="4" fill="var(--art-4)"/>
    <path d="M90 132q10 8 20 0" stroke="var(--art-4)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  cable: `${base(56)}
    <g fill="var(--art-1)">
      <path d="M40 92h36v56H40z" rx="8"/><path d="M82 92h36v56H82z"/><path d="M124 92h36v56h-36z"/>
    </g>
    ${lay(40, 92, 120, 56, 8)}
    <g stroke="var(--art-2)" stroke-width="7" fill="none" stroke-linecap="round">
      <path d="M58 92V64q0-14 14-14"/><path d="M100 92V56q0-14 14-14"/><path d="M142 92V72q0-14-14-14"/>
    </g>
    <circle cx="72" cy="50" r="6" fill="var(--art-3)"/><circle cx="114" cy="42" r="6" fill="var(--art-3)"/><circle cx="128" cy="58" r="6" fill="var(--art-3)"/>`,

  notecube: `${base(56)}
    <rect x="52" y="76" width="96" height="90" rx="10" fill="var(--art-1)"/>
    ${lay(52, 76, 96, 90, 10)}
    <rect x="62" y="56" width="76" height="30" rx="6" fill="var(--art-2)"/>
    <rect x="70" y="46" width="60" height="26" rx="6" fill="var(--art-3)"/>
    <path d="M78 110h44M78 126h32" stroke="var(--art-4)" stroke-width="4" stroke-linecap="round" opacity=".35"/>`,

  /* --- kids ------------------------------------------------ */
  minis: `${base(64)}
    <g fill="var(--art-1)"><path d="M34 166v-40q0-18 16-18t16 18v40z"/><path d="M134 166v-40q0-18 16-18t16 18v40z"/></g>
    <g fill="var(--art-2)"><path d="M72 166v-54q0-20 18-20t18 20v54z"/></g>
    ${horn(48, 108, 24, 14)}${horn(148, 108, 24, 14)}${horn(88, 92, 30, 16)}
    ${lay(34, 64, 132, 102, 10)}
    <circle cx="44" cy="132" r="3" fill="var(--art-4)"/><circle cx="144" cy="132" r="3" fill="var(--art-4)"/>
    <circle cx="84" cy="118" r="3.5" fill="var(--art-4)"/>`,

  tractor: `${base(64)}
    <rect x="46" y="94" width="72" height="38" rx="8" fill="var(--art-1)"/>
    <rect x="80" y="62" width="40" height="36" rx="8" fill="var(--art-2)"/>
    <rect x="88" y="70" width="24" height="20" rx="4" fill="var(--art-4)" opacity=".35"/>
    ${lay(46, 62, 74, 70, 8)}
    <circle cx="66" cy="140" r="22" fill="var(--art-4)"/><circle cx="66" cy="140" r="9" fill="var(--art-3)"/>
    <circle cx="134" cy="146" r="16" fill="var(--art-4)"/><circle cx="134" cy="146" r="6" fill="var(--art-3)"/>
    <rect x="118" y="112" width="34" height="20" rx="6" fill="var(--art-1)"/>
    <rect x="52" y="52" width="10" height="44" rx="5" fill="var(--art-3)"/>`,

  dino: `${base(62)}
    <path d="M44 150q-4-46 30-58t56 10q20 16 14 48z" fill="var(--art-1)"/>
    ${lay(44, 82, 100, 68, 24)}
    <path d="M132 100q22-6 26 14t-20 26" stroke="var(--art-1)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <g fill="var(--art-3)"><path d="M62 92l8-18 8 18zM84 82l8-18 8 18zM106 80l8-18 8 18z"/></g>
    <circle cx="66" cy="112" r="5" fill="var(--art-4)"/>
    <rect x="52" y="148" width="20" height="18" rx="6" fill="var(--art-2)"/>
    <rect x="112" y="148" width="20" height="18" rx="6" fill="var(--art-2)"/>`,

  penguin: `${base(48)}
    <path d="M62 116q0-56 38-56t38 56-38 50-38-50z" fill="var(--art-4)"/>
    <path d="M78 122q0-40 22-40t22 40-22 38-22-38z" fill="var(--art-1)"/>
    ${lay(62, 60, 76, 106, 30)}
    <circle cx="90" cy="96" r="4" fill="var(--art-4)"/><circle cx="110" cy="96" r="4" fill="var(--art-4)"/>
    <path d="M100 104l10 8-10 8-10-8z" fill="var(--art-3)"/>
    <path d="M84 166h14M102 166h14" stroke="var(--art-3)" stroke-width="9" stroke-linecap="round"/>`,

  /* --- gifts / keys / custom ------------------------------- */
  giftbox: `${base(58)}
    <rect x="46" y="86" width="108" height="80" rx="10" fill="var(--art-1)"/>
    ${lay(46, 86, 108, 80, 10)}
    <rect x="38" y="68" width="124" height="26" rx="8" fill="var(--art-2)"/>
    <rect x="90" y="68" width="20" height="98" fill="var(--art-3)"/>
    <path d="M100 68q-22-4-22-20t22 4q0-20 22-4t-22 20z" fill="var(--art-3)"/>`,

  frame: `${base(56)}
    <rect x="44" y="44" width="112" height="112" rx="12" fill="var(--art-1)"/>
    ${lay(44, 44, 112, 112, 12)}
    <rect x="60" y="60" width="80" height="80" rx="6" fill="var(--art-4)" opacity=".25"/>
    <path d="M66 132l24-30 16 18 14-16 18 28z" fill="var(--art-2)"/>
    <circle cx="80" cy="82" r="8" fill="var(--art-3)"/>
    <path d="M100 156v10h-20" stroke="var(--art-4)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`,

  keys: `${base(58)}
    <g><circle cx="58" cy="62" r="13" fill="none" stroke="var(--art-3)" stroke-width="5"/><path d="M58 76l16 62H42z" fill="var(--art-1)"/>${lay(42, 76, 32, 62, 4)}</g>
    <g><circle cx="100" cy="46" r="13" fill="none" stroke="var(--art-3)" stroke-width="5"/><path d="M100 60l18 82H82z" fill="var(--art-2)"/>${lay(82, 60, 36, 82, 4)}</g>
    <g><circle cx="142" cy="62" r="13" fill="none" stroke="var(--art-3)" stroke-width="5"/><path d="M142 76l16 62h-32z" fill="var(--art-3)"/>${lay(126, 76, 32, 62, 4)}</g>`,

  animalkey: `${base(54)}
    <circle cx="100" cy="40" r="12" fill="none" stroke="var(--art-3)" stroke-width="5"/>
    <path d="M66 118q0-44 34-44t34 44-34 44-34-44z" fill="var(--art-1)"/>
    ${lay(66, 74, 68, 88, 26)}
    <path d="M72 82q-10-22 4-28t18 16zM128 82q10-22-4-28t-18 16z" fill="var(--art-2)"/>
    <circle cx="88" cy="110" r="4.5" fill="var(--art-4)"/><circle cx="112" cy="110" r="4.5" fill="var(--art-4)"/>
    <path d="M94 128q6 6 12 0" stroke="var(--art-4)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  plaque: `${base(62)}
    <rect x="30" y="52" width="140" height="94" rx="18" fill="var(--art-1)"/>
    ${lay(30, 52, 140, 94, 18)}
    <rect x="44" y="66" width="112" height="66" rx="12" fill="none" stroke="var(--art-4)" stroke-width="3" opacity=".45"/>
    ${horn(88, 52, 28, 24)}
    <path d="M60 98h80" stroke="var(--art-2)" stroke-width="8" stroke-linecap="round"/>
    <path d="M70 116h60" stroke="var(--art-2)" stroke-width="6" stroke-linecap="round" opacity=".6"/>
    <circle cx="56" cy="80" r="5" fill="var(--art-3)"/><circle cx="144" cy="80" r="5" fill="var(--art-3)"/>`,

  bust: `${base(56)}
    <rect x="62" y="140" width="76" height="26" rx="6" fill="var(--art-4)"/>
    <path d="M76 140q-8-46 14-66t44 4q12 16 4 36l-8 26z" fill="var(--art-1)"/>
    ${lay(70, 60, 74, 80, 18)}
    <path d="M114 76l18-50 6 54z" fill="var(--art-3)"/>
    <path d="M94 76q-15-14-7-28 13 4 18 22z" fill="var(--art-2)"/>
    <path d="M136 92q18 4 16 24t-22 22" stroke="var(--art-2)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="106" cy="100" r="5" fill="var(--art-4)"/>
    <path d="M82 116q10 8 18 2" stroke="var(--art-4)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

  upload: `${base(54)}
    <rect x="46" y="72" width="108" height="94" rx="14" fill="var(--art-1)"/>
    ${lay(46, 72, 108, 94, 14)}
    <path d="M100 138V88M100 88l-18 18M100 88l18 18" stroke="var(--art-4)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${horn(88, 72, 30, 24)}
    <circle cx="62" cy="52" r="5" fill="var(--art-3)"/><circle cx="142" cy="44" r="6" fill="var(--art-3)"/>`,
};
window.ART = ART;

/* ---------- the catalogue ----------------------------------
   tags drive the homepage rails and badges:
   new · bestseller · trending · limited · gift · festival
   quirky · personalised · madeinindia
   ----------------------------------------------------------- */
const D = (materials, dimensions, care, production, shipping) =>
  ({ materials, dimensions, care, production, shipping });

const CARE_STD  = 'Wipe with a dry or slightly damp cloth. Keep away from direct sunlight and parked cars — PLA softens above 50 C.';
const CARE_TOUGH= 'Wipe clean with a damp cloth and mild soap. Handles daily use and Indian summers.';
const PROD_STD  = 'Printed to order in our studio, then de-supported, sanded and inspected by hand. No two prints are identical.';
const SHIP_STD  = 'Dispatched in 2-4 working days. Tracked courier across India. Free shipping above ₹999.';

window.PRODUCTS = [

  /* ===== PUJA ============================================== */
  {
    id: 'kumkum-barni', name: 'Kumkum Barni', cat: 'puja', art: ART.barni,
    price: 449, was: 549,
    tags: ['bestseller', 'festival', 'gift', 'madeinindia'],
    blurb: 'A lidded kumkum pot with a snug screw-free fit, so it stays shut in the puja drawer.',
    story: 'We printed nine lids before one closed with the right amount of resistance. This is the ninth.',
    specs: { Material: 'PLA', Layer: '0.16 mm', Print: '3 h 10 m', Size: '90 mm' },
    variants: { size: SIZES, material: MATERIALS, colour: COLOURS },
    details: D('PLA as standard, PGLA or ABS on request. Food-contact sealer is not applied — this is for kumkum and haldi, not edibles.',
      'Small 60 mm · Medium 90 mm · Large 130 mm · X-Large 180 mm, measured at the widest point.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'diya-stand', name: 'Lotus Diya Stand', cat: 'puja', art: ART.diya,
    price: 599,
    tags: ['festival', 'trending'],
    blurb: 'Holds five tea lights in a lotus ring. The petals catch the light and throw it back up the wall.',
    specs: { Material: 'PLA', Layer: '0.16 mm', Print: '5 h', Size: '160 mm wide' },
    variants: { size: SIZES.slice(1, 3), material: MATERIALS, colour: COLOURS },
    details: D('PLA. Use LED tea lights, not open flame — printed plastic and fire do not mix.',
      'Medium 160 mm · Large 210 mm across.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'agarbatti-holder', name: 'Agarbatti Holder with Ash Tray', cat: 'puja', art: ART.agarbatti,
    price: 279,
    tags: ['festival', 'new'],
    blurb: 'Three stick slots over a catch tray, so ash lands in one place instead of on the shelf.',
    specs: { Material: 'PLA', Layer: '0.2 mm', Print: '2 h 20 m', Size: '140 x 70 mm' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('PLA. The tray lifts out for cleaning.', '140 x 70 x 40 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'puja-bell-stand', name: 'Puja Bell Stand', cat: 'puja', art: ART.bell,
    price: 349,
    tags: ['festival', 'madeinindia'],
    blurb: 'A cradle for the ghanti so it stops rolling off the thali.',
    specs: { Material: 'PGLA', Layer: '0.16 mm', Print: '2 h 40 m', Size: '110 mm' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('PGLA for a little extra weight and gloss.', '110 x 110 x 90 mm.', CARE_TOUGH, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'toran-set', name: 'Marigold Toran', cat: 'puja', art: ART.toran,
    price: 899, was: 1099,
    tags: ['festival', 'trending', 'gift'],
    blurb: 'A doorway toran that does not wilt by day two. Threads onto any cord you already own.',
    specs: { Material: 'PLA', Layer: '0.2 mm', Print: '9 h set', Size: '900 mm span' },
    variants: { colour: COLOURS },
    details: D('PLA leaves and flowers on a cotton cord (included).',
      'Roughly 900 mm across, 180 mm at the longest drop.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },

  /* ===== LIGHTING ========================================== */
  {
    id: 'lumina-lamp', name: 'Lumina Unicorn Night Lamp', cat: 'light', art: ART.lamp,
    price: 1499, was: 1899,
    tags: ['bestseller', 'gift', 'quirky'],
    blurb: 'A translucent unicorn head that glows like a sunrise. Warm LED, USB-C, three brightness steps.',
    story: 'Printed at 0.12 mm with two walls, so the layer lines become the light pattern instead of a flaw.',
    specs: { Material: 'PLA+ translucent', Layer: '0.12 mm', Print: '9 h 20 m', Size: '140 x 90 x 180 mm' },
    variants: { size: SIZES.slice(1), colour: COLOURS.slice(0, 6) },
    details: D('Translucent PLA+ shade, warm 2700K LED module, USB-C cable included.',
      'Medium 180 mm tall · Large 220 mm · X-Large 260 mm.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: false, reviews: [],
  },
  {
    id: 'moon-lamp', name: 'Little Moon Lamp', cat: 'light', art: ART.moon,
    price: 1299,
    tags: ['new', 'gift', 'trending'],
    blurb: 'Craters printed from real lunar elevation data, lit from inside. Dimmable, touch base.',
    specs: { Material: 'PLA translucent', Layer: '0.1 mm', Print: '11 h', Size: '150 mm sphere' },
    variants: { size: SIZES.slice(1, 3), colour: COLOURS.slice(0, 4) },
    details: D('Translucent PLA sphere, touch-dimmable base, USB-C.',
      'Medium 150 mm · Large 190 mm sphere.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: false, reviews: [],
  },
  {
    id: 'cloud-light', name: 'Raincloud Ambient Light', cat: 'light', art: ART.cloud,
    price: 1699,
    tags: ['quirky', 'limited'],
    blurb: 'A cloud with three printed rain streaks that catch the light. Sits on a shelf, changes a room.',
    specs: { Material: 'PLA translucent', Layer: '0.12 mm', Print: '13 h', Size: '240 mm wide' },
    variants: { colour: COLOURS.slice(0, 5) },
    details: D('Translucent PLA, warm LED strip, USB-C.', '240 x 120 x 180 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: false, reviews: [],
  },

  /* ===== HOME & LIVING ===================================== */
  {
    id: 'celeste-planter', name: 'Celeste Unicorn Planter', cat: 'home', art: ART.planter,
    price: 899, was: 1099,
    tags: ['bestseller', 'quirky', 'gift'],
    blurb: 'Self-watering reservoir hidden in the base. Fits a 4-inch succulent, judges you gently.',
    specs: { Material: 'PLA + sealer', Layer: '0.2 mm', Print: '5 h 40 m', Size: '120 x 120 x 150 mm' },
    variants: { size: SIZES.slice(0, 3), material: MATERIALS, colour: COLOURS },
    details: D('PLA with an internal sealer coat so water does not seep through the layer lines.',
      'Small 90 mm · Medium 120 mm · Large 160 mm, fits a 4-inch nursery pot at Medium.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'wishbone-bookends', name: 'Wishbone Bookend Pair', cat: 'home', art: ART.bookends,
    price: 1699,
    tags: ['limited'],
    blurb: 'Weighted with steel shot so real books actually stay put. Felt pads underneath.',
    specs: { Material: 'PETG + steel', Layer: '0.2 mm', Print: '11 h pair', Size: '120 x 100 x 150 mm' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('PGLA shell, steel shot ballast, felt base pads. Sold as a pair.',
      '120 x 100 x 150 mm each.', CARE_TOUGH, PROD_STD, SHIP_STD),
    bulk: false, reviews: [],
  },
  {
    id: 'moonstone-tray', name: 'Moonstone Trinket Tray', cat: 'home', art: ART.tray,
    price: 379,
    tags: ['new'],
    blurb: 'For keys, rings and the earring you take off at the door. Rubber feet, no scratched wood.',
    specs: { Material: 'PLA', Layer: '0.2 mm', Print: '2 h 50 m', Size: '160 x 110 mm' },
    variants: { size: SIZES.slice(0, 3), colour: COLOURS },
    details: D('PLA with silicone feet.', 'Small 120 mm · Medium 160 mm · Large 200 mm long.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'bloom-vase', name: 'Bloom Spiral Vase', cat: 'home', art: ART.vase,
    price: 749,
    tags: ['trending'],
    blurb: 'Printed in one continuous spiral, so there is not a single seam on it. Holds water.',
    specs: { Material: 'PLA + sealer', Layer: '0.24 mm', Print: '4 h 30 m', Size: '110 x 200 mm' },
    variants: { size: SIZES.slice(1), colour: COLOURS },
    details: D('Vase-mode PLA with internal sealer. Use a glass insert for long-stem arrangements.',
      'Medium 200 mm · Large 260 mm · X-Large 320 mm tall.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: false, reviews: [],
  },
  {
    id: 'cloud-hooks', name: 'Cloud Wall Hooks', cat: 'home', art: ART.hooks,
    price: 299,
    tags: ['new', 'quirky'],
    blurb: 'Three hooks on one rail. Takes a school bag without complaint. Screws included.',
    specs: { Material: 'PGLA', Layer: '0.2 mm', Print: '3 h', Size: '240 mm rail' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('PGLA rail with wall plugs and screws.', '240 x 60 x 70 mm. Holds 3 kg per hook.',
      CARE_TOUGH, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },

  /* ===== DESK & OFFICE ===================================== */
  {
    id: 'starlight-organizer', name: 'Starlight Desk Organizer', cat: 'desk', art: ART.organizer,
    price: 1199,
    tags: ['bestseller'],
    blurb: 'Four wells for pens, clips, cables and the one screwdriver you keep losing.',
    specs: { Material: 'PLA matte', Layer: '0.2 mm', Print: '7 h', Size: '180 x 90 x 120 mm' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('Matte PLA, felt base.', '180 x 90 x 120 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'mane-stand', name: 'Rainbow Mane Phone Stand', cat: 'desk', art: ART.stand,
    price: 599,
    tags: ['trending'],
    blurb: 'Holds your phone at the exact angle that makes video calls flattering. Rubber feet, cable slot.',
    specs: { Material: 'PGLA', Layer: '0.2 mm', Print: '2 h 10 m', Size: '95 x 80 x 110 mm' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('PGLA with silicone grip pads. Works with a case on.',
      '95 x 80 x 110 mm. Fits phones up to 9 mm thick.', CARE_TOUGH, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'unicorn-penpot', name: 'Unicorn Pen Pot', cat: 'desk', art: ART.penpot,
    price: 429,
    tags: ['quirky'],
    blurb: 'A pen pot with a face. It is watching you not finish your work.',
    specs: { Material: 'PLA', Layer: '0.2 mm', Print: '3 h 20 m', Size: '90 x 110 mm' },
    variants: { size: SIZES.slice(0, 3), colour: COLOURS },
    details: D('PLA.', 'Small 80 mm · Medium 110 mm · Large 140 mm tall.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'cable-herders', name: 'Cable Herders (Set of 3)', cat: 'desk', art: ART.cable,
    price: 249,
    tags: ['new', 'bestseller'],
    blurb: 'Weighted clips that keep the charging cable from falling behind the desk. Every single time.',
    specs: { Material: 'PGLA', Layer: '0.16 mm', Print: '1 h 40 m', Size: '45 mm each' },
    variants: { colour: COLOURS },
    details: D('PGLA with 3M adhesive pads and steel ballast.', '45 x 30 x 22 mm each, set of three.',
      CARE_TOUGH, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'note-cube', name: 'Sticky Note Cube', cat: 'desk', art: ART.notecube,
    price: 389,
    tags: ['new'],
    blurb: 'Holds a 76 mm note block, a pen and nothing else. That is the whole idea.',
    specs: { Material: 'PLA matte', Layer: '0.2 mm', Print: '2 h 30 m', Size: '95 mm cube' },
    variants: { material: MATERIALS, colour: COLOURS },
    details: D('Matte PLA. Note block not included.', '95 x 95 x 90 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },

  /* ===== KIDS ============================================== */
  {
    id: 'mini-herd', name: 'Mini Unicorn Herd', cat: 'kids', art: ART.minis,
    price: 799,
    tags: ['gift', 'quirky'],
    blurb: 'Five palm-sized unicorns in a graded pastel set. Shelf, dashboard, cake topper, up to you.',
    specs: { Material: 'Silk PLA', Layer: '0.12 mm', Print: '3 h 30 m', Size: '45-70 mm' },
    variants: { colour: COLOURS },
    details: D('Silk PLA. Not suitable for children under three — small parts.',
      'Five figures, 45 to 70 mm tall.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'tractor-toy', name: 'Rolling Tractor', cat: 'kids', art: ART.tractor,
    price: 549,
    tags: ['trending', 'gift'],
    blurb: 'Print-in-place wheels that actually roll, straight off the bed. No screws, nothing to lose.',
    story: 'The axles print with a 0.3 mm gap so they free themselves the first time you spin them.',
    specs: { Material: 'PLA', Layer: '0.16 mm', Print: '4 h', Size: '150 mm' },
    variants: { size: SIZES.slice(0, 3), colour: COLOURS },
    details: D('PLA. Not suitable for children under three.',
      'Small 110 mm · Medium 150 mm · Large 190 mm long.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Name on the side', max: 12, placeholder: 'e.g. Arjun' },
    reviews: [],
  },
  {
    id: 'dino-puzzle', name: 'Dino Snap Puzzle', cat: 'kids', art: ART.dino,
    price: 459,
    tags: ['new'],
    blurb: 'Nine pieces that snap into a stegosaurus and come apart again without a fight.',
    specs: { Material: 'PLA', Layer: '0.16 mm', Print: '3 h 40 m', Size: '170 mm assembled' },
    variants: { colour: COLOURS },
    details: D('PLA. Not suitable for children under three.', '170 x 70 x 110 mm assembled.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'wobble-penguin', name: 'Wobble Penguin', cat: 'kids', art: ART.penguin,
    price: 289,
    tags: ['quirky', 'new'],
    blurb: 'Weighted base, so it rocks and rights itself. Strangely difficult to put down.',
    specs: { Material: 'PLA + steel', Layer: '0.16 mm', Print: '2 h', Size: '95 mm' },
    variants: { colour: COLOURS },
    details: D('PLA with steel ballast sealed in the base.', '95 mm tall.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },

  /* ===== GIFTS ============================================= */
  {
    id: 'joy-box', name: 'The Little Joy Box', cat: 'gifts', art: ART.giftbox,
    price: 1299, was: 1599,
    tags: ['gift', 'bestseller', 'festival'],
    blurb: 'A curated box: one small lamp, one keychain, one desk piece, wrapped and carded.',
    specs: { Material: 'Mixed', Layer: '0.16 mm', Print: 'Made to order', Size: '220 x 160 x 90 mm' },
    variants: { colour: COLOURS.slice(0, 5) },
    details: D('Contents vary by season. Tell us the occasion in the notes and we will match it.',
      'Box 220 x 160 x 90 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Message on the card', max: 60, placeholder: 'Happy birthday, Meera!' },
    reviews: [],
  },
  {
    id: 'photo-frame', name: 'Sunburst Photo Frame', cat: 'gifts', art: ART.frame,
    price: 649,
    tags: ['gift', 'personalised'],
    blurb: 'A 4x6 frame with a printed sunburst edge. Add a name along the base.',
    specs: { Material: 'PLA matte', Layer: '0.16 mm', Print: '4 h 20 m', Size: 'Fits 4x6 in' },
    variants: { colour: COLOURS },
    details: D('Matte PLA with an acrylic front and a folding stand.', 'Fits a 4 x 6 inch photo.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Name along the base', max: 18, placeholder: 'e.g. Meera & Arjun' },
    reviews: [],
  },

  /* ===== KEYCHAINS ========================================= */
  {
    id: 'sparkle-keys', name: 'Sparkle Horn Keychains', cat: 'keys', art: ART.keys,
    price: 349,
    tags: ['bestseller', 'gift'],
    blurb: 'Three twisted horns in pearl, blush and gold. Light enough to forget, loud enough to find.',
    specs: { Material: 'Silk PLA', Layer: '0.16 mm', Print: '48 m', Size: '62 mm each' },
    variants: { colour: COLOURS },
    details: D('Silk PLA with steel split rings. Set of three.', '62 mm each.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, reviews: [],
  },
  {
    id: 'animal-keys', name: 'Animal Keychain', cat: 'keys', art: ART.animalkey,
    price: 179,
    tags: ['new', 'quirky'],
    blurb: 'Cat, dog, bunny or bear. Pick the animal in the notes and we print that one.',
    specs: { Material: 'PLA', Layer: '0.16 mm', Print: '35 m', Size: '55 mm' },
    variants: { colour: COLOURS },
    details: D('PLA with a steel split ring.', '55 x 45 mm.', CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Which animal', max: 20, placeholder: 'Cat / dog / bunny / bear' },
    reviews: [],
  },
  {
    id: 'name-keychain', name: 'Name Keychain', cat: 'keys', art: ART.plaque,
    price: 199,
    tags: ['personalised', 'gift', 'trending'],
    blurb: 'Your name, printed in two colours, on a ring. The most-ordered return gift we make.',
    specs: { Material: 'Dual PLA', Layer: '0.16 mm', Print: '40 m', Size: 'Up to 70 mm' },
    variants: { colour: COLOURS },
    details: D('Dual-colour PLA with a steel split ring.', 'Up to 70 mm wide depending on name length.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Name to print', max: 14, placeholder: 'e.g. HARIKRISHNA' },
    reviews: [],
  },

  /* ===== CUSTOM ============================================ */
  {
    id: 'name-plaque', name: 'Custom Name Plaque', cat: 'custom', art: ART.plaque,
    price: 1099,
    tags: ['personalised', 'gift'],
    blurb: 'Send us a name, we model it and print it. Door, desk, nursery. Two-colour by default.',
    specs: { Material: 'Dual PLA', Layer: '0.16 mm', Print: '4 h', Size: 'Up to 220 mm wide' },
    variants: { size: SIZES.slice(1), colour: COLOURS },
    details: D('Dual-colour PLA with keyhole mounts on the back.',
      'Medium up to 160 mm · Large up to 220 mm · X-Large up to 300 mm wide.',
      CARE_STD, PROD_STD, SHIP_STD),
    bulk: true, personalise: { label: 'Name to print', max: 24, placeholder: 'e.g. Aarohi' },
    reviews: [],
  },
  {
    id: 'nova-bust', name: 'Nova Unicorn Bust', cat: 'custom', art: ART.bust,
    price: 2499,
    tags: ['limited'],
    blurb: 'Printed at fifty microns, hand-sanded, then finished in matte pearl. Our showpiece.',
    specs: { Material: 'Grey resin', Layer: '0.05 mm', Print: '14 h', Size: '110 x 90 x 210 mm' },
    variants: { size: SIZES.slice(1, 3), colour: COLOURS.slice(0, 4) },
    details: D('Grey resin, UV cured, hand sanded, matte sealed. Brittle — display piece, not a toy. Not for children under three.',
      'Medium 210 mm · Large 260 mm tall.',
      'Dust with a soft dry brush. Keep out of direct sunlight; resin yellows.',
      'Resin printed, washed in IPA, UV cured, then sanded and sealed by hand over two days.',
      SHIP_STD),
    bulk: false, reviews: [],
  },
  {
    id: 'your-design', name: 'Print Your Design', cat: 'custom', art: ART.upload,
    price: 0, quote: true,
    tags: ['personalised', 'madeinindia'],
    blurb: 'Your STL, your sketch, or a MakerWorld link. We quote it, you approve it, we print it.',
    specs: { Material: 'Your choice', Layer: '0.05-0.28 mm', Print: 'Quoted', Size: 'Up to 250 mm' },
    details: D('PLA, PGLA, ABS or resin — whichever suits the model.',
      'Our build volume is 250 x 250 x 250 mm. Larger pieces are printed in parts and joined.',
      CARE_STD,
      'You send the file or link, we check it prints cleanly, quote you on WhatsApp, and print once you approve.',
      'Quoted in 2-3 days, printed in 3-7 days depending on size and queue.'),
    bulk: true, reviews: [],
  },
];
