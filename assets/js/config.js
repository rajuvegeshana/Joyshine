/* ============================================================
   JOYSHINE — one place to change everything business-related.
   Edit this file, reload. No build step, no npm, no server.
   ============================================================ */

window.JOYSHINE = {

  brand: {
    name: 'Joyshine',
    tagline: 'Creative things for a brighter everyday.',
    mission: 'Small things. Big joy.',
    blurb: 'Discover playful, useful and beautifully crafted products made to bring a little more joy into everyday life.',
    origin: 'Made in INDIA with love',
    email: 'joyshine.3d@gmail.com',
    instagram: 'https://www.instagram.com/joyshine3d',
  },

  /* ---- WhatsApp ----------------------------------------------
     Full international format, digits only. No +, no spaces.     */
  whatsapp: {
    number: '917337773186',
    greeting: 'New Joyshine order',
    customGreeting: 'Hi Joyshine! I would like to request a custom print.',
    bulkGreeting: 'Hi Joyshine! I would like bulk pricing.',
  },

  /* ---- Razorpay ----------------------------------------------
     Add your Key ID (Dashboard - Account & Settings - API Keys).
     Until then Buy now shows a reminder instead of opening.
     orderEndpoint is optional; see README section 3.             */
  razorpay: {
    keyId: 'rzp_test_REPLACE_ME',
    orderEndpoint: null,
    themeColor: '#9b7bff',
  },

  /* ---- Money & shipping ------------------------------------ */
  currency: 'INR',
  currencySymbol: '₹',
  shipping: {
    flat: 79,
    freeAbove: 999,
  },

  /* ---- Bulk pricing tiers -----------------------------------
     off = percent off the unit price at that quantity.           */
  bulk: {
    askAbove: 20,
    tiers: [
      { min: 1,  max: 4,    off: 0 },
      { min: 5,  max: 9,    off: 5 },
      { min: 10, max: 24,   off: 10 },
      { min: 25, max: 49,   off: 15 },
      { min: 50, max: null, off: 20 },
    ],
  },

  /* ---- Custom print ---------------------------------------- */
  custom: {
    materials: ['PLA', 'PGLA', 'ABS', 'Resin', 'Not sure yet'],
    colours: ['White', 'Black', 'Pink', 'Yellow', 'Green', 'Blue', 'Gold', 'Let Joyshine choose'],
    sizes: ['Small (up to 60 mm)', 'Medium (60-120 mm)', 'Large (120-200 mm)', 'Extra large (200 mm+)', 'Not sure yet'],
    minQty: 1,
    turnaround: '2-3 days to quote, 3-7 days to print',
    fileTypes: '.stl, .3mf, .obj, .jpg, .png, .pdf',
    maxSizeMB: 50,
  },

  /* ---- Occasions ---------------------------------------------
     The festival calendar lives in occasions.js and is edited in
     the admin panel (admin.html). This block is the master switch.

     auto          let today's festival re-skin the shop
     forceTheme    pin one look and ignore occasions entirely
     forceOccasion run a specific occasion right now, off-season   */
  occasions: {
    auto: true,
    forceTheme: null,      // 'retro' | 'future' | 'clay' | null
    forceOccasion: null,   // an id from occasions.js, or null
  },

  /* ---- Engineering & prototyping service line ----------------
     Same studio, different customer. Wears the futuristic look.  */
  engineering: {
    active: true,
    name: 'Joyshine Engineering',
    tagline: 'Prototypes, jigs and short runs.',
    blurb: 'Functional parts in engineering plastics, printed and measured in our studio. Send a STEP or STL, get a quote and a lead time.',
    theme: 'future',
    whatsappGreeting: 'Hi Joyshine Engineering! I have a part to quote.',
    services: [
      ['Rapid prototyping', 'Form and fit parts in 24-72 hours so you can hold the thing before you commit to tooling.'],
      ['Jigs & fixtures', 'Assembly aids, drill guides and alignment blocks built around your part.'],
      ['Short-run manufacturing', 'Five to five hundred parts. Cheaper than tooling, faster than waiting for it.'],
      ['Replacement parts', 'Discontinued knobs, clips, housings and brackets, remodelled from a sample or a drawing.'],
      ['Enclosures', 'Housings for boards and sensors, with heat-set insert bosses and cable routing.'],
      ['Design for print', 'We fix wall thickness, overhangs and tolerances before it reaches the bed.'],
    ],
    materials: [
      ['PLA',  'Prototyping', '60 C',  'Cheapest and fastest. Form and fit only.'],
      ['PETG', 'Functional',  '75 C',  'Tough and a little flexible. Good general purpose part.'],
      ['ABS',  'Functional',  '95 C',  'Heat tolerant, machinable, solvent smoothable.'],
      ['Nylon','Engineering', '120 C', 'Living hinges, gears, snap fits. Absorbs moisture.'],
      ['Resin','Detail',      '60 C',  'Fifty microns for fine features. Brittle.'],
    ],
    specs: [
      ['Build volume',   '250 x 250 x 250 mm, larger parts printed in sections and bonded'],
      ['Layer height',   '0.05 mm resin, 0.12-0.28 mm filament'],
      ['Tolerance',      'Typically +/- 0.3 mm or +/- 0.3%, whichever is greater'],
      ['Files accepted', 'STEP, STL, 3MF, OBJ, IGES, or a dimensioned drawing'],
      ['Lead time',      'Quote in 24 hours, parts in 2-7 days depending on quantity'],
      ['Minimum order',  'None. One part is a fine order.'],
    ],
  },

  /* ---- Supabase (optional) ------------------------------------
     Fill these in and the control panel saves straight to the
     cloud — no downloading and committing a file. Leave them
     blank and everything falls back to assets/data/site.json.

     The anon key is PUBLIC. It belongs in this file. What keeps
     your shop safe is Row Level Security, set up by running
     supabase/schema.sql. Never paste the service_role key here. */
  supabase: {
    url: 'https://fofjkevcrzxlaqbetqhq.supabase.co',
    anonKey: 'sb_publishable_wXgPdGGVAfiwttCqaEY2tw_mOfYLYep',
    table: 'settings',
    row: 'site',
  },

  /* ---- Marketing: ribbon, welcome offer -----------------------
     All of it is editable in the control panel.                  */
  marketing: {
    ribbon: { on: false, text: '', cta: '', href: '#/shop', dismissible: true },
    welcome: {
      on: false, delay: 6, art: 'giftbox',
      eyebrow: 'Welcome', title: '', body: '',
      code: '', cta: 'Start shopping', href: '#/shop', small: '',
    },
  },

  /* ---- Legal & policies ---------------------------------------
     Razorpay will not activate an account without these pages on
     the site. Fill in the blanks below in the control panel; the
     footer links stay hidden until `published` is true, so the
     shop never shows a half-written policy.

     Everything left empty is something only you know. Nothing
     here is guessed on your behalf.                               */
  legal: {
    published: false,
    entity: '',            // the name you trade and invoice under
    address: '',           // full address, as registered
    gst: '',               // GSTIN, or leave blank if not registered
    email: 'joyshine.3d@gmail.com',
    phone: '+91 73377 73186',
    returnDays: 7,         // days to raise a return on unused shelf items
    refundDays: 7,         // working days to refund once approved
    dispatchDays: '2-4',   // working days before it ships
    deliveryDays: '2-6',   // working days in transit
    cancelHours: 24,       // hours to cancel before printing starts
    jurisdiction: '',      // the city whose courts govern disputes
  },

  /* ---- Analytics ----------------------------------------------
     Google Analytics 4. Nothing loads until the visitor agrees,
     so declining means no Google cookies at all. The shop's own
     visit counter is separate and always on.                     */
  analytics: {
    on: true,
    ga4: 'G-66TDCC1TTN',
  },

  /* ---- SEO ---------------------------------------------------- */
  seo: {
    title: 'Joyshine \u2014 Creative things for a brighter everyday',
    description: 'Joyshine makes 3D-printed and handcrafted things for everyday life \u2014 puja accessories, lamps, desk pieces, kids toys, keychains and custom prints.',
    keywords: '3d printing india, kumkum barni, unicorn lamp, custom 3d print, return gifts',
    ogImage: '',
  },

  /* ---- Which look loads first: retro | future | clay -------- */
  defaultTheme: 'clay',

  /* ---- Homepage rails: reorder or delete freely -------------
     kind: 'new' | 'trending' | 'bestseller' | 'gift' | 'under'
           | 'festival' | 'cat' | 'badge' | 'recent'             */
  rails: [
    { kind: 'new',        title: 'New Arrivals',      note: 'Fresh off the print bed.' },
    { kind: 'bestseller', title: 'Best Sellers',      note: 'What everyone is buying.' },
    { kind: 'festival',   title: null,                note: null },
    { kind: 'under',      title: 'Under ₹299',   note: 'Small joys, small spends.', max: 299 },
    { kind: 'gift',       title: 'Gift Ideas',        note: 'Wrapped, named, ready to hand over.' },
    { kind: 'trending',   title: 'Trending',          note: 'Moving fast this week.' },
    { kind: 'under',      title: 'Under ₹499',   note: 'Return gifts and little treats.', max: 499 },
    { kind: 'cat',        title: 'Made for Your Home',note: 'Decor that earns its shelf space.', cat: 'home' },
    { kind: 'badge',      title: 'Cute & Quirky',     note: 'Things you did not know you needed.', badge: 'quirky' },
    { kind: 'badge',      title: 'Personalised',      note: 'Your name, your colours, your idea.', badge: 'personalised' },
    { kind: 'recent',     title: 'Continue Exploring',note: 'Where you left off.' },
  ],
};
