# Fleek Curated — Demo Presentation Script

**Time:** ~3 minutes (live demo) · ~5 minutes (with Q&A buffer)  
**Tagline:** *Curate any look into a sourceable Fleek wardrobe — for you, for set, for scale.*

---

## 0. Open (15 sec)

> "Hi — we're **Fleek Curated**.  
> You see a look you love — on Pinterest, on set, in a mirror. Today that stops at inspiration.  
> We turn that **one photo** into a **full wardrobe you can actually source** on joinfleek.com — and only *then* let you preview customisations like branding or embroidery."

**Point at screen:** Hero — three audience cards.

> "This works for **individuals** building a unique style, **film and set teams** dressing cast from a reference, and **brands or resellers** sourcing wholesale at scale."

---

## 1. The problem (20 sec)

> "Fleek has incredible wholesale inventory — but going from *'I want this outfit'* to *'here are the exact bundles to buy'* is manual.  
> People search piece by piece. Costume departments rebuild looks in spreadsheets. Brands can't quickly see what a logo or embroidery would look like before they commit to a bundle.  
> **Curation comes first. Customisation is the upsell — not the starting point.**"

---

## 2. What we built (20 sec)

> "A three-step AI wardrobe studio:
> 1. **Inspire** — share a look  
> 2. **Wardrobe** — we identify each piece behind the scenes and match **selectable** Fleek listings  
> 3. **Customise** — optional AI preview on the listing you picked"

---

## 3. Live demo — say this while you click (90 sec)

### Step 1 — Share a look

**Click:** Demo tab → *Model in blue suit* → **Curate Fleek wardrobe**

> "I'm uploading our demo — a full business-formal look. In production this is any photo: your outfit, a film still, a brand mood board.  
> Behind the scenes, Gemini is reading the image — jacket, shirt, trousers, tie — and matching Fleek listings."

*Wait for loading — "Building your wardrobe" state:*

> "You don't see a dev extraction panel — that's intentional. The product goes straight to a **curated wardrobe**.  
> If you need the API contract for judging, expand **Developer view** at the bottom."

---

### Step 2 — Wardrobe (the money moment)

**Scroll to:** Your curated wardrobe → expand **Browse & select Fleek listing** on **Jacket** or **Tie**

> "This is the core insight: we're not dumping you on a search page.  
> We show **real listing cards** — like joinfleek.com — title, price, per-piece cost.  
> You **select** the exact bundle you want to source."

**Click:** Select a listing (e.g. Harris Tweed Blazers or Designer Ties)

> "That selection matters — this product image is what powers customisation."

---

### Step 3 — Customise (optional upsell)

**Click:** **Customise this piece** on the tie → **Generate preview**

> "Only after curation do we offer customisation.  
> Say I want **'join fleek' embroidery** on this Hugo Boss tie — Gemini previews the alteration on the **Fleek listing image** we selected."

**Scroll to:** Pricing / order review if visible

> "We show **wholesale bundle economics** — per piece, promo code, mock checkout back to Fleek.  
> Curation drives the wardrobe sale; customisation drives the margin."

---

## 4. Close (20 sec)

> "Fleek Curated: **inspiration → curated wardrobe → optional branded preview**.  
> Personal style, film sets, mass brand — one pipeline, powered by Gemini, grounded in Fleek inventory.  
> We'd love to plug into Fleek's real product feed next. Thank you."

---

## Quick reference — demo checklist

| # | Action | Say |
|---|--------|-----|
| 1 | Open localhost:3000 | Three audiences on hero |
| 2 | Demo → full outfit → Curate | "Building your wardrobe" loading |
| 3 | Wardrobe → browse listings → **select one** | "Pick the actual Fleek product" |
| 4 | Customise tie → generate | "Upsell after curation" |
| 5 | Show pricing | "Wholesale + mock order" |

---

## If something breaks (backup lines)

| Issue | Say |
|-------|-----|
| API down | "We're in offline demo mode — same flow, mock catalogue. Live Gemini runs when the API is up." |
| Gemini slow | "We're building your wardrobe — extraction runs in the background, usually a few seconds." |
| No listing image | "Select a listing first — customisation uses that product image." |
| Judge asks "why not just search?" | "Search gives you a grid. We **coordinate the full outfit**, score cohesion, and **carry your selection** into customisation and pricing." |

---

## One-paragraph submission description (copy-paste)

**Fleek Curated** is an AI wardrobe studio for joinfleek.com. Users upload a reference look; Gemini extracts each garment and matches garment-appropriate Fleek wholesale listings. Users browse and select specific products per piece, building a coordinated wardrobe before optionally previewing customisations (e.g. embroidered branding) with Gemini image editing. Built for individuals curating personal style, film/set costume teams, and companies sourcing mass-branded wholesale inventory.

---

## Elevator pitch (30 sec, no demo)

> "Fleek Curated turns any outfit photo into a shoppable wardrobe on joinfleek.com. Gemini extracts every piece, we match real wholesale listings, you pick the exact bundle — then optionally preview branding with AI. Personal style, film sets, wholesale brands — curation first, customisation second."
