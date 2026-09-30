# Joyshine — product brief

Source of truth for the build. Supplied by the founder, 2026-09-30.

**Tagline:** Creative things for a brighter everyday.
**Mission:** Create small things that bring big joy.
**Made in:** India
**Personality:** warm, playful, creative, premium but approachable, fun,
family-friendly, giftable, modern, handmade/maker feel.

D2C brand for 3D-printed and handcrafted lifestyle products. The site should
feel like a creative discovery + shopping experience, not generic ecommerce.

## Customers
Indian households · home décor buyers · gift buyers · parents · festival
shoppers · puja-room décor · 3D-print enthusiasts · personalisation buyers ·
small affordable gifts · desk accessories · cute/quirky/functional products.

## Categories
- **Home & Living** — décor, wall, table, organisers, storage, lamps, functional
- **Puja & Spiritual** — Kumkum Barni, puja accessories, festival décor
- **Desk & Office** — organisers, pen holders, phone stands, cable management
- **Kids** — toys, animals, educational, mini figures, puzzles
- **Gifts** — birthday, return, festival, personalised, couple, corporate
- **Keychains & Small** — animal, character, name/personalised
- **Lighting** — 3D-printed lamps, table lamps, ambient
- **Custom / Personalised** — custom name, designs, prints, uploads, STL

## Customer journey
Discover → Explore → Search → Product → Customise → Cart → Checkout →
Confirmation → Delivery → Review

Custom: Discover → Search → Upload/Custom Print → Submit → WhatsApp/Quote →
Approval → Production → Delivery

## Storefront
**Header:** logo, Shop, Categories, Custom Print, Gifts, About, Search, Account,
Cart. Simplified on mobile.

**Hero:** "Creative things for a brighter everyday." Sub: discover playful,
useful and beautifully crafted products made to bring a little more joy into
everyday life. CTAs: Shop Products / Create Something Custom. Unicorn imagery,
3D objects, sparkles, playful motion, clay-style objects, subtle 3D-print refs.

**Unicorn** is a brand character: homepage, loading, file upload, success,
empty states, search, micro-interactions. Horn sparkle. Playful but premium —
never a children's toy site.

**Homepage rails:** New Arrivals · Trending · Best Sellers · Gift Ideas ·
Under ₹299 · Under ₹499 · Festival Collection · Made for Your Home ·
Cute & Quirky · Personalised.

**Category nav:** cards with imagery, icons, horizontal scroll on mobile,
sticky where appropriate; stays visible while browsing the Shop page.

**Search** is a major feature. Dedicated experience, soft grey background, clean
and spacious: input, recent searches, popular searches, suggested categories,
trending products, results, filters, sorting, suggestions while typing.

**Search — nothing found.** Never a dead end. Offer: Upload Your Design ·
Upload STL · Share a MakerWorld Link · Ask Joyshine. It should read as a product
discovery assistant.

**Product cards:** image, name, price, was-price, discount, rating, wishlist,
quick add, category, variants, badges (New / Best Seller / Trending / Limited /
Personalised / Made in India). Curvy clay visual language.

**Product detail:** gallery (multiple, close-up, lifestyle, in-use, angles, size
reference); name, price, discount, description, material, dimensions, weight,
colour, size, quantity. Variants — size S/M/L/XL, material PLA/PGLA/ABS, colour.
Customisation — name, text, colour, size, custom image, custom design.
Live preview that updates as options change.
Expandable: Description · Materials · Dimensions · Care · Production ·
Shipping · Customisation.

**Bulk orders:** "Need 20+ pieces?" Request bulk pricing. Admin-configurable
tiers: 1–4 / 5–9 / 10–24 / 25–49 / 50+. For return gifts, corporate, events,
weddings, festivals, school events, birthdays.

**Custom Print** (key differentiator): Upload Image · Upload 3D File (STL) ·
MakerWorld Link · Describe Your Idea.
Form collects name, phone, email, file, reference link, quantity, size,
material, colour, notes, required date. Confirmation: "Your idea is on its
way! ✨" Then **Continue on WhatsApp** with the enquiry pre-filled.

**Cart:** product, image, variant, colour, size, qty, price, discount,
subtotal, shipping, total. Increase/decrease/remove/save for later.
"You may also like".

**Checkout:** name, mobile, email, address, city, state, PIN, delivery
instructions. Order summary, discounts, shipping, total, payment.

**Confirmation:** "Yay! Your Joyshine order is confirmed! ✨" Order number,
products, total, delivery estimate, tracking, continue shopping, subtle
unicorn/sparkle.

**Account:** profile, orders, tracking, saved products, wishlist, addresses,
custom print requests, recently viewed.

**Wishlist:** product, price, availability, add to cart, remove. Optionally
notify on price change / back in stock.

**Reviews:** rating, text, customer images, verified purchase. Homepage
"What our customers say" — real reviews, not placeholders.

**Also:** recommended products (you may also like / complete the look /
frequently bought together / more from this category), recently viewed
("Continue Exploring"), share product (WhatsApp, copy link) with rich preview.

## Admin (non-technical)
- **Products:** add, edit, delete, duplicate, hide, publish, featured,
  bestseller, trending. Fields: name, description, category, price, discount,
  SKU, images, videos, materials, colours, sizes, dimensions, weight, stock,
  production time.
- **Variants:** per-variant price, stock, image, dimensions.
- **Images:** multiple, primary, reorder, delete, lifestyle, detail; crop,
  resize, position, fit, background.
- **Homepage:** hero title/description/image/CTA, featured products,
  categories, banners, promos, reviews, collections, festival sections;
  show/hide and reorder sections.
- **Brand settings:** logo (desktop/mobile), typography, colours (primary,
  secondary, accent, background, text, buttons, cards), visual theme (radius,
  card style, button style, shadows, gradients).
- **Unicorn/animation settings:** toggle hero, loading, upload, success,
  sparkles.
- **Upload settings:** enable/disable, max size, file types, instructions,
  confirmation copy, WhatsApp destination, custom-print form fields.
- **Custom print settings:** materials, colours, sizes, min quantity, bulk
  tiers, instructions, required/optional fields, WhatsApp template, processing
  time.
- **Inventory:** current, low, out of stock, availability per variant;
  "Made to Order" instead of stock where relevant.
- **Orders:** new, processing, printing, quality check, packed, shipped,
  delivered, cancelled. Customer, products, variants, qty, price, address,
  payment status, status, notes.
- **Custom print requests:** customer, request, files, links, qty, material,
  colour, size, notes, date, status (New / Reviewing / Quoted / Customer
  Approved / Printing / Completed / Rejected).
- **Promotions:** discount codes, percentage, fixed, product, category, bulk,
  festival, first-order.
- **Festival collections:** Diwali, Sankranti, Ugadi, Dussehra, Ganesh
  Chaturthi, Raksha Bandhan, Christmas, New Year, Valentine's, Mother's Day,
  Father's Day.

## Experience rules
- **Mobile-first.** Sticky bottom nav, easy search, large touch targets,
  horizontal category scroll, swipeable images, quick add, sticky Add to Cart,
  easy checkout, floating WhatsApp/custom-print. Not a shrunken desktop site.
- **Empty states** with personality — "Your cart is feeling a little lonely."
- **Loading** — unicorn/sparkle/3D-print animation or skeletons, never long.
- **Errors** friendly and actionable — "Oops! Something went wrong." + Try Again.
- **Toasts** short and friendly for every action.
- **Accessibility** — contrast, readable type, large targets, keyboard nav,
  meaningful labels, clear errors, never colour alone.
- **Trust** — Made in India, materials, dimensions, processing time, shipping,
  returns, custom-product policy, contact. Say plainly that minor layer lines
  and small variations are part of 3D printing.
- **FAQ** — orders, custom printing, products, shipping, returns.

## Visual direction
Clay-style UI + soft curves + playful 3D objects + premium ecommerce.
Rounded cards, curved sections, soft shapes, friendly type, generous spacing,
soft backgrounds, product-focused imagery, subtle shadows, premium composition,
playful illustration, unicorn details, sparkles.

Avoid: generic templates, excessive gradients, too many colours, rounding
everything, childish visuals, overloaded pages, excessive animation.

3D-printing identity stays subtle: layer textures, filament graphics, print
lines, rotating previews, maker illustration.

## Future
Handmade, 3D printed, personalised, digital designs, DIY kits, gift boxes,
subscription boxes, corporate gifting, bulk orders, custom manufacturing.

## Feature test
Build a feature only if it answers at least one: does it help customers
discover, purchase, customise; does it increase trust; does it reduce support
effort; does it help Joyshine manage products/orders; does it differentiate
from generic ecommerce? Otherwise keep it simpler.

## North star
**Small things. Big joy.**
Discover something → fall in love with it → personalise it → buy it → or create
something completely their own.
