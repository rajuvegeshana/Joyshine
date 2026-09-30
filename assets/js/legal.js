/* ===========================================================
   POLICY PAGES
   Razorpay will not activate an account without these, and an
   Indian online shop needs them regardless.

   The privacy policy is written from what this site actually
   does — every store and every third party named here is one I
   can point at in the code. The commercial terms come from the
   numbers you set in the panel. Nothing is invented: anything
   you have not filled in simply keeps the pages unpublished.
   =========================================================== */
window.LEGAL = (() => {
'use strict';

const L = () => window.JOYSHINE.legal || {};
const B = () => window.JOYSHINE.brand || {};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const money = n => window.S ? S.money(n) : '₹' + n;

/* what is still missing before these can go live */
function missing() {
  const l = L(), out = [];
  if (!l.entity) out.push('the name you trade under');
  if (!l.address) out.push('your business address');
  if (!l.jurisdiction) out.push('the city for the jurisdiction clause');
  return out;
}
const ready = () => missing().length === 0;

const updated = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function page(title, intro, sections) {
  return `<section class="band band--tight wrap legal">
    <div class="headrow"><div>
      <p class="eyebrow r">Policy</p>
      <h2 class="r" style="--d:60ms">${esc(title)}</h2>
      ${intro ? `<p class="lede r" style="--d:110ms">${esc(intro)}</p>` : ''}
      <p class="quiet r" style="--d:150ms;font-size:.82rem;margin-top:.8rem">
        Last updated ${updated()} · ${esc(L().entity || B().name)}</p>
    </div></div>
    <div class="legal__body r">
      ${sections.map(([h, ...ps]) => `<h3>${esc(h)}</h3>${ps.map(t => `<p>${t}</p>`).join('')}`).join('')}
    </div>
  </section>`;
}

const who = () => `${esc(L().entity || B().name)}${L().gst ? `, GSTIN ${esc(L().gst)}` : ''}`;
const contactLine = () =>
  `${esc(L().email || B().email)}${L().phone ? ` or WhatsApp ${esc(L().phone)}` : ''}`;

/* ---------- privacy ---------------------------------------- */
const privacy = () => page('Privacy Policy',
  'What we collect, why, and who else sees it. Written from what the site actually does.',
  [
    ['Who we are',
      `This shop is run by ${who()}, at ${esc(L().address)}. For anything in this policy, write to ${contactLine()}.`],

    ['What we collect when you order',
      `When you place an order or send a custom print request, we record what you told us: your name, phone number, email if you gave one, delivery address, the items, and any note you added. We need this to make the thing and get it to you.`,
      `Orders placed through WhatsApp also exist in your WhatsApp conversation with us, which is governed by WhatsApp's own privacy policy, not ours.`],

    ['What we collect when you just look around',
      `We count visits: one row per browser per day, holding the page you landed on and the site that sent you. It carries no name, no account and no identifier that points back to you. We use it to see whether the shop is getting busier.`,
      `If you agree to it, Google Analytics also runs. It sets cookies and sends data to Google. If you decline, no Google script loads at all and no Google cookie is set. You can change your mind by clearing this site's data in your browser.`],

    ['What stays on your own device',
      `Your basket, your wishlist, the products you recently viewed, the theme you picked and the delivery address you last typed are kept in your browser's local storage. They never reach us. Clearing your browser data removes them.`],

    ['Who else sees your data',
      `<strong>Supabase</strong> hosts our database and stores orders, requests and reviews. <strong>GitHub Pages</strong> serves the website itself. <strong>Razorpay</strong> handles card and UPI payments — we never see or store your card details. <strong>Google Analytics</strong>, only if you agreed. <strong>WhatsApp</strong>, if you order that way. Our courier partner receives your name, address and phone so they can deliver.`,
      `We do not sell your data, and we do not share it with anyone for advertising.`],

    ['How long we keep it',
      `Order records are kept while they may be needed for tax, warranty or a dispute. Visit counts are aggregate and kept indefinitely because they identify nobody. Ask us to delete your order history and we will, unless we are required to keep it.`],

    ['Your rights',
      `Under India's Digital Personal Data Protection Act 2023 you can ask what we hold about you, ask us to correct it, ask us to delete it, and withdraw consent you have given. Write to ${contactLine()} and we will respond within a reasonable period.`],

    ['Children',
      `This shop is not aimed at children, and we do not knowingly collect data from anyone under 18. Some products are marked as unsuitable for children under three; that is a choking-hazard note, not an age gate.`],

    ['Changes',
      `If this policy changes we will update the date at the top. Material changes will be flagged on the site.`],
  ]);

/* ---------- terms ------------------------------------------ */
const terms = () => page('Terms of Service', 'The rules that apply when you buy from us.', [
  ['Who you are dealing with',
    `${who()}, at ${esc(L().address)}. Contact: ${contactLine()}.`],

  ['Made to order',
    `Almost everything here is printed after you order it. Nothing sits in a warehouse. That is why lead times are measured in days rather than hours, and why a personalised piece cannot be resold if you change your mind.`],

  ['Prices and payment',
    `Prices are in Indian Rupees and include applicable taxes unless stated otherwise. We may change prices at any time, but never after you have paid for an order. Payments are processed by Razorpay; we do not see or store your card details.`,
    `If an item is listed at an obviously wrong price because of a mistake on our side, we will contact you and either honour it or cancel and refund in full. We will not quietly ship something different.`],

  ['What 3D printing looks like',
    `These are printed objects, not injection-moulded ones. Fine layer lines are normal and are part of how the process looks. Colours can vary slightly between batches of filament. Dimensions are accurate to roughly a third of a millimetre unless a product says otherwise. None of that is a defect.`],

  ['Cancelling',
    `You can cancel any order within ${L().cancelHours} hours, or any time before we start printing it, whichever comes first. After that a made-to-order piece is already being made.`],

  ['Custom and personalised work',
    `We print exactly the text you give us, including its spelling. Check it before you order; a reprint is a new order. For custom commissions we quote first and only start once you approve.`,
    `You confirm you have the right to whatever design, image or model you send us. We will not print anything that infringes someone else's rights, and we may decline a job without giving a reason.`],

  ['Bulk and corporate orders',
    `Bulk pricing is shown on the product page and applies automatically. Large orders may need a deposit; we will say so before starting.`],

  ['Liability',
    `Our responsibility for any order is limited to what you paid for it. Decorative items are not toys, lamps are for indoor use, and resin pieces are brittle. Use products for what they are described as.`],

  ['Governing law',
    `These terms are governed by the laws of India. Disputes fall under the courts of ${esc(L().jurisdiction)}.`],
]);

/* ---------- refunds ----------------------------------------- */
const refunds = () => page('Refund & Cancellation Policy',
  'What can be returned, what cannot, and how quickly you get your money back.', [
  ['Cancelling before we print',
    `Cancel within ${L().cancelHours} hours of ordering, or any time before printing starts, and you get a full refund with no questions.`],

  ['Returning a shelf item',
    `Unused items bought from the shop can be returned within ${L().returnDays} days of delivery, in their original packaging. Message us on WhatsApp and we will arrange it.`],

  ['What cannot be returned',
    `Personalised and custom-made pieces. Once your name or your design is printed on something it cannot be sold to anyone else, so we cannot take it back unless it arrived damaged or is not what you ordered.`],

  ['If it arrives damaged or wrong',
    `Send us a photo within 48 hours of delivery and we will reprint it or refund you in full, whichever you prefer. You will not pay return shipping for our mistake.`],

  ['How refunds reach you',
    `Approved refunds are issued to the original payment method within ${L().refundDays} working days. Your bank may take a few days more to show it. Orders paid by UPI or card are refunded through Razorpay; WhatsApp orders paid another way are refunded the same way you paid.`],

  ['Shipping charges',
    `Where shipping was charged, it is refunded on a full return of a faulty or incorrect order. On a change-of-mind return, the shipping charge is not refunded.`],

  ['Getting in touch',
    `${contactLine()}. We answer WhatsApp fastest.`],
]);

/* ---------- shipping ---------------------------------------- */
const shipping = () => {
  const s = window.JOYSHINE.shipping || {};
  return page('Shipping Policy', 'When it leaves us, how it travels, and what it costs.', [
    ['Making time',
      `Shelf items are printed and dispatched within ${esc(L().dispatchDays)} working days. Custom and personalised pieces take longer because they are made from scratch; we tell you the date when we quote.`],

    ['Delivery time',
      `Once dispatched, most orders arrive in ${esc(L().deliveryDays)} working days depending on your PIN code. Remote areas take longer. Festival weeks are slower everywhere.`],

    ['What it costs',
      `Shipping is ${money(s.flat)} flat, and free on orders of ${money(s.freeAbove)} or more. The exact charge is shown in your basket before you pay.`],

    ['Where we ship',
      `All over India. We do not ship internationally at the moment — message us if you need it and we will see what is possible.`],

    ['Tracking',
      `We send the courier tracking link on WhatsApp the day your order ships. Reply on that thread any time for an update.`],

    ['Packaging',
      `Recycled fill inside a rigid box. Lamps and resin pieces get a second inner box. If something arrives damaged, photograph it before unpacking further and send us the picture.`],

    ['If it goes missing',
      `If tracking has not moved for five working days, tell us. We will chase the courier and, if it is genuinely lost, reprint your order at no cost.`],
  ]);
};

/* ---------- contact ----------------------------------------- */
const contact = () => page('Contact Us', 'The fastest way to reach us is WhatsApp.', [
  ['Joyshine',
    `${who()}<br>${esc(L().address).replace(/,\s*/g, ',<br>')}`],
  ['Message us',
    `WhatsApp: ${esc(L().phone)}<br>Email: ${esc(L().email || B().email)}`],
  ['When we reply',
    `We answer WhatsApp within a few hours on working days. Email can take a day.`],
  ['For a custom print',
    `Use the <a href="#/custom">Custom Print</a> page. It collects what we need to quote, then hands you a ready-made WhatsApp message.`],
]);

return { privacy, terms, refunds, shipping, contact, ready, missing };
})();
