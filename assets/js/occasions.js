/* ===========================================================
   OCCASIONS — the festival calendar that re-skins the shop.

   Each occasion can switch the theme, put a banner on the
   homepage and feature a product tag, for a window around its
   date. Edit these in the admin panel (admin.html), not here.

   DATES: fixed-date and nth-weekday occasions are computed for
   any year automatically and never need touching. Lunar
   festivals move every year, so their dates are left EMPTY on
   purpose — a guessed Diwali date would silently re-skin the
   shop on the wrong week. Set them once a year in the admin
   panel; an occasion with no date for the current year simply
   stays switched off.
   =========================================================== */

window.OCCASIONS = [

  /* ---- fixed dates: computed every year, nothing to maintain ---- */
  { id: 'new-year', name: 'New Year', on: true, theme: 'christmas',
    when: { type: 'fixed', md: '01-01' }, lead: 10, trail: 3, tag: 'gift',
    banner: { eyebrow: 'New Year', title: 'Start it brighter.',
      note: 'Desk pieces, lamps and little gifts to begin the year with.' } },

  { id: 'sankranti', name: 'Makar Sankranti / Pongal', on: true, theme: 'retro',
    when: { type: 'fixed', md: '01-14' }, lead: 10, trail: 2, tag: 'festival',
    banner: { eyebrow: 'Sankranti', title: 'Kites, sugar and sunshine.',
      note: 'Festival decor and puja pieces, printed and ready.' } },

  { id: 'republic-day', name: 'Republic Day', on: true, theme: 'tiranga',
    when: { type: 'fixed', md: '01-26' }, lead: 5, trail: 1, tag: 'madeinindia',
    banner: { eyebrow: 'Republic Day', title: 'Made in India, every layer.',
      note: 'Designed, sliced and printed here.' } },

  /* ---- Valentine's week: 7 to 14 February ----------------
     Each day is its own single-day window, so it beats the
     fortnight-long Valentine's run-up on the day itself. */

  { id: 'rose-day', name: 'Rose Day', on: true, theme: 'rose',
    when: { type: 'fixed', md: '02-07' }, lead: 0, trail: 0, tag: 'gift',
    banner: { eyebrow: 'Rose Day', title: 'One that will not wilt.',
      note: 'Printed roses, stems and little keepsakes for the seventh.' } },

  { id: 'propose-day', name: 'Propose Day', on: true, theme: 'propose',
    when: { type: 'fixed', md: '02-08' }, lead: 0, trail: 0, tag: 'personalised',
    banner: { eyebrow: 'Propose Day', title: 'Say it in something solid.',
      note: 'Name plaques, boxes and pieces made to be handed over.' } },

  { id: 'chocolate-day', name: 'Chocolate Day', on: true, theme: 'chocolate',
    when: { type: 'fixed', md: '02-09' }, lead: 0, trail: 0, tag: 'gift',
    banner: { eyebrow: 'Chocolate Day', title: 'Everything but the cocoa.',
      note: 'Boxes, trays and toppers to go with the sweet part.' } },

  { id: 'teddy-day', name: 'Teddy Day', on: true, theme: 'teddy',
    when: { type: 'fixed', md: '02-10' }, lead: 0, trail: 0, tag: 'quirky',
    banner: { eyebrow: 'Teddy Day', title: 'Soft things, hard plastic.',
      note: 'Little printed companions for the shelf and the desk.' } },

  { id: 'promise-day', name: 'Promise Day', on: true, theme: 'promise',
    when: { type: 'fixed', md: '02-11' }, lead: 0, trail: 0, tag: 'personalised',
    banner: { eyebrow: 'Promise Day', title: 'Put it in writing.',
      note: 'Engraved plaques and keepsakes with your words on them.' } },

  { id: 'hug-day', name: 'Hug Day', on: true, theme: 'hug',
    when: { type: 'fixed', md: '02-12' }, lead: 0, trail: 0, tag: 'gift',
    banner: { eyebrow: 'Hug Day', title: 'Something to hold.',
      note: 'Round, warm, palm-sized pieces for the twelfth.' } },

  { id: 'kiss-day', name: 'Kiss Day', on: true, theme: 'kiss',
    when: { type: 'fixed', md: '02-13' }, lead: 0, trail: 0, tag: 'personalised',
    banner: { eyebrow: 'Kiss Day', title: 'Sealed with one.',
      note: 'Small printed somethings for the day before the day.' } },

  { id: 'valentines', name: "Valentine's Day", on: true, theme: 'valentine',
    when: { type: 'fixed', md: '02-14' }, lead: 14, trail: 1, tag: 'personalised',
    banner: { eyebrow: "Valentine's", title: 'Put their name on it.',
      note: 'Personalised plaques, keychains and little printed somethings.' } },

  { id: 'baisakhi', name: 'Baisakhi / Vaisakhi', on: false, theme: 'retro',
    when: { type: 'fixed', md: '04-14' }, lead: 7, trail: 1, tag: 'festival',
    banner: { eyebrow: 'Baisakhi', title: 'Harvest bright.',
      note: 'Festival decor for the season.' } },

  { id: 'independence-day', name: 'Independence Day', on: true, theme: 'tiranga',
    when: { type: 'fixed', md: '08-15' }, lead: 7, trail: 1, tag: 'madeinindia',
    banner: { eyebrow: 'Independence Day', title: 'Made in India, every layer.',
      note: 'Small things, printed close to home.' } },

  { id: 'teachers-day', name: "Teachers' Day", on: false, theme: 'clay',
    when: { type: 'fixed', md: '09-05' }, lead: 7, trail: 1, tag: 'gift',
    banner: { eyebrow: "Teachers' Day", title: 'For the ones who explained it twice.',
      note: 'Desk pieces and personalised keepsakes.' } },

  { id: 'childrens-day', name: "Children's Day", on: true, theme: 'clay',
    when: { type: 'fixed', md: '11-14' }, lead: 7, trail: 1, tag: 'quirky',
    banner: { eyebrow: "Children's Day", title: 'Toys that came off a printer.',
      note: 'Rolling tractors, snap puzzles and a herd of unicorns.' } },

  { id: 'halloween', name: 'Halloween', on: false, theme: 'halloween',
    when: { type: 'fixed', md: '10-31' }, lead: 14, trail: 1, tag: 'quirky',
    banner: { eyebrow: 'Halloween', title: 'Printed, not carved.',
      note: 'Pumpkins, little monsters and things that glow in the dark.' } },

  { id: 'christmas', name: 'Christmas', on: true, theme: 'christmas',
    when: { type: 'fixed', md: '12-25' }, lead: 21, trail: 5, tag: 'gift',
    banner: { eyebrow: 'Christmas', title: 'Wrapped, named, ready.',
      note: 'Gift boxes and personalised pieces, dispatched in time.' } },

  /* ---- nth weekday: also computed every year ---- */
  { id: 'mothers-day', name: "Mother's Day", on: true, theme: 'clay',
    when: { type: 'nth', month: 5, weekday: 0, n: 2 }, lead: 14, trail: 1, tag: 'gift',
    banner: { eyebrow: "Mother's Day", title: 'Something she will actually keep.',
      note: 'Planters, trinket trays and personalised plaques.' } },

  { id: 'fathers-day', name: "Father's Day", on: false, theme: 'clay',
    when: { type: 'nth', month: 6, weekday: 0, n: 3 }, lead: 14, trail: 1, tag: 'desk',
    banner: { eyebrow: "Father's Day", title: 'For the desk he never tidies.',
      note: 'Organisers, stands and cable wrangling.' } },

  { id: 'friendship-day', name: 'Friendship Day', on: false, theme: 'clay',
    when: { type: 'nth', month: 8, weekday: 0, n: 1 }, lead: 10, trail: 1, tag: 'keys',
    banner: { eyebrow: 'Friendship Day', title: 'Matching keychains, obviously.',
      note: 'Name keychains and little printed sets.' } },

  /* ---- a season, not a day ---- */
  { id: 'wedding-season', name: 'Wedding season', on: false, theme: 'retro',
    when: { type: 'range', from: '11-15', to: '02-15' }, lead: 0, trail: 0, tag: 'gift',
    banner: { eyebrow: 'Wedding season', title: 'Return gifts, sorted.',
      note: 'Bulk pricing from 25 pieces. Names printed on every one.' } },

  /* ---- lunar: set the date each year in the admin panel ----
     dates: { "2026": "2026-11-08" }  <- one line per year        */
  { id: 'vasant-panchami', name: 'Vasant Panchami', on: false, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'festival',
    banner: { eyebrow: 'Vasant Panchami', title: 'Yellow everything.',
      note: 'Puja pieces and festival decor.' } },

  { id: 'shivaratri', name: 'Maha Shivaratri', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'puja',
    banner: { eyebrow: 'Maha Shivaratri', title: 'For the puja shelf.',
      note: 'Diya stands, barnis and agarbatti holders.' } },

  { id: 'holi', name: 'Holi', on: true, theme: 'holi',
    when: { type: 'set', dates: {} }, lead: 14, trail: 2, tag: 'quirky',
    banner: { eyebrow: 'Holi', title: 'Every colour we stock.',
      note: 'Pick your filament. We print it in that.' } },

  { id: 'ugadi', name: 'Ugadi / Gudi Padwa', on: true, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 10, trail: 2, tag: 'festival',
    banner: { eyebrow: 'Ugadi', title: 'A new year, a new shelf.',
      note: 'Toran, diya stands and decor for the door.' } },

  { id: 'ram-navami', name: 'Ram Navami', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'puja',
    banner: { eyebrow: 'Ram Navami', title: 'For the puja room.',
      note: 'Printed pieces for the shelf.' } },

  { id: 'eid-fitr', name: 'Eid al-Fitr', on: true, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 14, trail: 2, tag: 'gift',
    banner: { eyebrow: 'Eid Mubarak', title: 'Gifts, wrapped and named.',
      note: 'Personalised plaques, lamps and gift boxes.' } },

  { id: 'akshaya-tritiya', name: 'Akshaya Tritiya', on: false, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'gift',
    banner: { eyebrow: 'Akshaya Tritiya', title: 'Something lasting.',
      note: 'Keepsakes and decor in antique gold.' } },

  { id: 'eid-adha', name: 'Bakrid / Eid al-Adha', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 10, trail: 2, tag: 'gift',
    banner: { eyebrow: 'Eid Mubarak', title: 'Gifts, wrapped and named.',
      note: 'Personalised pieces and gift boxes.' } },

  { id: 'rath-yatra', name: 'Rath Yatra', on: false, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'festival',
    banner: { eyebrow: 'Rath Yatra', title: 'Festival decor.',
      note: 'Printed pieces for the season.' } },

  { id: 'guru-purnima', name: 'Guru Purnima', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'gift',
    banner: { eyebrow: 'Guru Purnima', title: 'For the ones who taught you.',
      note: 'Desk pieces and personalised keepsakes.' } },

  { id: 'raksha-bandhan', name: 'Raksha Bandhan', on: true, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 14, trail: 1, tag: 'personalised',
    banner: { eyebrow: 'Raksha Bandhan', title: 'Put their name on it.',
      note: 'Name keychains and plaques, printed to order.' } },

  { id: 'janmashtami', name: 'Janmashtami', on: false, theme: 'krishna',
    when: { type: 'set', dates: {} }, lead: 10, trail: 1, tag: 'puja',
    banner: { eyebrow: 'Janmashtami', title: 'For the puja shelf.',
      note: 'Decor and puja pieces, printed here.' } },

  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', on: true, theme: 'ganesh',
    when: { type: 'set', dates: {} }, lead: 14, trail: 3, tag: 'puja',
    banner: { eyebrow: 'Ganesh Chaturthi', title: 'Decor for the mandap.',
      note: 'Toran, diya stands and puja accessories.' } },

  { id: 'onam', name: 'Onam', on: false, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 10, trail: 2, tag: 'festival',
    banner: { eyebrow: 'Onam', title: 'Flowers that do not wilt.',
      note: 'Printed toran and festival decor.' } },

  { id: 'navratri', name: 'Navratri', on: true, theme: 'navratri',
    when: { type: 'set', dates: {} }, lead: 10, trail: 9, tag: 'festival',
    banner: { eyebrow: 'Navratri', title: 'Nine nights of decor.',
      note: 'Toran, lamps and puja pieces in every colour.' } },

  { id: 'durga-ashtami', name: 'Durga Ashtami', on: false, theme: 'navratri',
    when: { type: 'set', dates: {} }, lead: 4, trail: 1, tag: 'puja',
    banner: { eyebrow: 'Ashtami', title: 'For the eighth night.',
      note: 'Puja pieces, lamps and decor for the mandap.' } },

  { id: 'dussehra', name: 'Dussehra', on: true, theme: 'navratri',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'festival',
    banner: { eyebrow: 'Dussehra', title: 'Festival decor, printed.',
      note: 'For the door, the shelf and the puja room.' } },

  { id: 'karva-chauth', name: 'Karva Chauth', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 10, trail: 1, tag: 'personalised',
    banner: { eyebrow: 'Karva Chauth', title: 'Something with their name on it.',
      note: 'Personalised keepsakes and puja pieces.' } },

  { id: 'dhanteras', name: 'Dhanteras', on: true, theme: 'diwali',
    when: { type: 'set', dates: {} }, lead: 10, trail: 1, tag: 'festival',
    banner: { eyebrow: 'Dhanteras', title: 'Antique gold, freshly printed.',
      note: 'Diya stands, barnis and decor in gold.' } },

  { id: 'diwali', name: 'Diwali', on: true, theme: 'diwali',
    when: { type: 'set', dates: {} }, lead: 28, trail: 3, tag: 'festival',
    banner: { eyebrow: 'Diwali', title: 'Diyas that do not drip.',
      note: 'Diya stands, toran, lamps and gift boxes, ready before the festival.' } },

  { id: 'bhai-dooj', name: 'Bhai Dooj', on: false, theme: 'diwali',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'personalised',
    banner: { eyebrow: 'Bhai Dooj', title: 'Name on it, obviously.',
      note: 'Personalised keychains and plaques.' } },

  { id: 'chhath', name: 'Chhath Puja', on: false, theme: 'retro',
    when: { type: 'set', dates: {} }, lead: 7, trail: 2, tag: 'puja',
    banner: { eyebrow: 'Chhath Puja', title: 'For the puja shelf.',
      note: 'Printed puja pieces and decor.' } },

  { id: 'guru-nanak', name: 'Guru Nanak Jayanti', on: false, theme: 'clay',
    when: { type: 'set', dates: {} }, lead: 7, trail: 1, tag: 'gift',
    banner: { eyebrow: 'Gurpurab', title: 'Quiet, careful things.',
      note: 'Decor and keepsakes, printed to order.' } },
];

/* ===========================================================
   RESOLVER — which occasion, if any, is running today
   =========================================================== */
window.OCC = (() => {
'use strict';

const DAY = 86400000;
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mk = (y, m, d) => new Date(y, m - 1, d);

/* nth weekday of a month, e.g. the 2nd Sunday in May */
function nth(year, month, weekday, n) {
  const first = mk(year, month, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return mk(year, month, 1 + shift + (n - 1) * 7);
}

/* the date an occasion falls on in a given year, or null */
function dateIn(occ, year) {
  const w = occ.when || {};
  if (w.type === 'fixed') { const [m, d] = w.md.split('-').map(Number); return mk(year, m, d); }
  if (w.type === 'nth')   return nth(year, w.month, w.weekday, w.n);
  if (w.type === 'set')   { const s = (w.dates || {})[year]; return s ? new Date(s + 'T00:00:00') : null; }
  return null;
}

/* the window an occasion is live for, in a given year */
function windowIn(occ, year) {
  const w = occ.when || {};
  if (w.type === 'range') {
    const [fm, fd] = w.from.split('-').map(Number);
    const [tm, td] = w.to.split('-').map(Number);
    const from = mk(year, fm, fd);
    let to = mk(year, tm, td);
    if (to <= from) to = mk(year + 1, tm, td);       // wraps the new year
    return { from, to, on: from };
  }
  const d = dateIn(occ, year);
  if (!d) return null;
  /* the window runs from the start of the first lead day to the END of
     the last trail day, so a trail of 0 still covers the day itself —
     otherwise a one-day occasion would close at midnight before it began. */
  return { from: new Date(+d - (occ.lead || 0) * DAY),
           to: new Date(+d + (occ.trail || 0) * DAY + DAY - 1), on: d };
}

/* does this occasion need a date before it can ever run? */
const needsDate = occ => occ.when?.type === 'set';
function missingYears(occ, from = new Date().getFullYear(), n = 2) {
  if (!needsDate(occ)) return [];
  const out = [];
  for (let y = from; y < from + n; y++) if (!(occ.when.dates || {})[y]) out.push(y);
  return out;
}

/* whichever enabled occasion is live now. Ties go to the shorter
   window, so Dhanteras beats a month-long Diwali run-up. */
function active(now = new Date(), list = window.OCCASIONS) {
  const y = now.getFullYear();
  let best = null, bestSpan = Infinity;
  for (const occ of list) {
    if (!occ.on) continue;
    for (const yy of [y - 1, y, y + 1]) {
      const w = windowIn(occ, yy);
      if (!w || now < w.from || now > w.to) continue;
      const span = +w.to - +w.from;
      if (span < bestSpan) { best = { ...occ, window: w }; bestSpan = span; }
    }
  }
  return best;
}

/* the next few coming up, for the admin panel */
function upcoming(now = new Date(), n = 6, list = window.OCCASIONS) {
  const out = [];
  const y = now.getFullYear();
  for (const occ of list) {
    for (const yy of [y, y + 1]) {
      const w = windowIn(occ, yy);
      if (!w || w.to < now) continue;
      out.push({ occ, ...w });
      break;
    }
  }
  return out.sort((a, b) => a.on - b.on).slice(0, n);
}

return { active, upcoming, windowIn, dateIn, missingYears, needsDate, iso, nth };
})();
