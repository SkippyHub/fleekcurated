/** Mock pricing — mirrors backend part2_customizer/pricing.py for demo mode */

import type { MockOrder, PriceEstimate, PriceLineItem } from "./types";

const GEMINI_IMAGE_COST_USD = 0.067;
const GEMINI_STYLING_COST_USD = 0.003;
const USD_TO_GBP = 0.79;
const CUSTOMIZATION_BASE_GBP = 4.99;

const CATEGORY_BUNDLE_GBP: Record<string, number> = {
  tie: 328,
  shirt: 185,
  "t-shirt": 103,
  hoodie: 119,
  jeans: 109,
  jacket: 409,
  trousers: 195,
  shorts: 135,
};

const ITEM_TO_PRODUCT: Record<string, string> = {
  tie: "fleek-hugo-boss-tie",
  "tie-selected": "fleek-hugo-boss-tie",
  jacket: "fleek-mens-blazer-mix",
  shirt: "fleek-hugo-boss-formal-shirts",
  trousers: "fleek-mens-formal-trousers",
};

export const PRODUCT_PRICING: Record<
  string,
  { title: string; bundleGbp: number; label: string; pieces?: number; url: string }
> = {
  "fleek-hugo-boss-tie": {
    title: "Designer Ties Bundle (500 pcs)",
    bundleGbp: Math.round(415 * USD_TO_GBP * 100) / 100,
    label: "Wholesale bundle",
    pieces: 500,
    url: "https://www.joinfleek.com/products/designer-ties-bundle-set-of-500",
  },
  "fleek-mens-blazer-mix": {
    title: "Men's Blazer & Suit Jacket Mix",
    bundleGbp: Math.round(420 * USD_TO_GBP * 100) / 100,
    label: "Wholesale bundle",
    pieces: 15,
    url: "https://www.joinfleek.com/search?q=mens+blazer+suit+jacket",
  },
  "fleek-hugo-boss-formal-shirts": {
    title: "Hugo Boss Formal Shirts Bundle",
    bundleGbp: Math.round(185 * USD_TO_GBP * 100) / 100,
    label: "Grade AB — formal line",
    pieces: 10,
    url: "https://www.joinfleek.com/search?q=Hugo+Boss+formal+dress+shirts&options[prefix]=last",
  },
  "fleek-mens-formal-trousers": {
    title: "Men's Formal Trousers Mix",
    bundleGbp: Math.round(195 * USD_TO_GBP * 100) / 100,
    label: "Wholesale bundle",
    pieces: 12,
    url: "https://www.joinfleek.com/search?q=mens+formal+trousers",
  },
  "fleek-y2k-baby-tee": {
    title: "Y2K Graphic Baby Tees",
    bundleGbp: Math.round(103 * USD_TO_GBP * 100) / 100,
    label: "$103 bundle",
    pieces: 10,
    url: "https://joinfleek.com",
  },
  "fleek-rl-polo": {
    title: "Ralph Lauren Polo T-Shirts",
    bundleGbp: Math.round(151 * USD_TO_GBP * 100) / 100,
    label: "$151 bundle",
    pieces: 10,
    url: "https://joinfleek.com",
  },
  "fleek-levis-501": {
    title: "Levi's 501 Vintage Jeans",
    bundleGbp: Math.round(109 * USD_TO_GBP * 100) / 100,
    label: "$109 bundle",
    pieces: 10,
    url: "https://joinfleek.com",
  },
  "fleek-carhartt-jacket": {
    title: "Carhartt Vintage Jacket",
    bundleGbp: Math.round(409 * USD_TO_GBP * 100) / 100,
    label: "$409 bundle",
    pieces: 15,
    url: "https://joinfleek.com",
  },
};

const PROMO_CODES: Record<string, { discountGbp: number; label: string }> = {
  APPFIRSTORDER: { discountGbp: 20, label: "£20 off first app order" },
};

export interface PiecePricing {
  productId: string;
  title: string;
  url: string;
  bundleGbp: number;
  piecesPerBundle: number;
  pricePerPieceGbp: number;
  priceLabel: string;
}

export function resolveProductId(itemId: string, explicitProductId?: string): string {
  if (explicitProductId?.startsWith("fleek-")) return explicitProductId;
  if (ITEM_TO_PRODUCT[itemId]) return ITEM_TO_PRODUCT[itemId];
  if (itemId.includes("tie")) return "fleek-hugo-boss-tie";
  return "fleek-hugo-boss-tie";
}

export function resolvePiecePricing(params: {
  itemId: string;
  productId?: string;
  productTitle?: string;
  productUrl?: string;
}): PiecePricing {
  const productId = resolveProductId(params.itemId, params.productId);
  const known = PRODUCT_PRICING[productId];
  const category = params.itemId.includes("tie")
    ? "tie"
    : params.itemId === "shirt"
      ? "shirt"
      : params.itemId.includes("jacket")
        ? "jacket"
        : params.itemId.includes("trouser")
          ? "trousers"
          : "t-shirt";

  const bundleGbp = known?.bundleGbp ?? CATEGORY_BUNDLE_GBP[category] ?? 150;
  const pieces = known?.pieces ?? 10;
  const title = params.productTitle ?? known?.title ?? "Fleek wholesale bundle";
  const url = params.productUrl ?? known?.url ?? "https://joinfleek.com";

  return {
    productId,
    title,
    url,
    bundleGbp,
    piecesPerBundle: pieces,
    pricePerPieceGbp: Math.round((bundleGbp / pieces) * 100) / 100,
    priceLabel: known?.label ?? "Wholesale bundle",
  };
}

function customizationComplexity(prompt: string): "low" | "medium" | "high" {
  const lower = prompt.toLowerCase();
  if (["recolour", "recolor", "pattern", "logo", "remove", "replace", "full"].some((k) => lower.includes(k))) {
    return "high";
  }
  if (["embroid", "brand", "colour", "color", "print", "monogram"].some((k) => lower.includes(k))) {
    return "medium";
  }
  return "low";
}

function customizationFeeGbp(prompt: string, includePreview: boolean): number {
  if (!includePreview) return 0;
  const mult = { low: 1, medium: 1.25, high: 1.5 }[customizationComplexity(prompt)];
  return Math.round(CUSTOMIZATION_BASE_GBP * mult * 100) / 100;
}

function apiCostGbp(): number {
  return Math.round((GEMINI_IMAGE_COST_USD + GEMINI_STYLING_COST_USD) * USD_TO_GBP * 100) / 100;
}

export function demoEstimateOrder(params: {
  productId: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
  quantity?: number;
  itemId?: string;
}): PriceEstimate {
  const pricing = resolvePiecePricing({
    itemId: params.itemId ?? params.productId,
    productId: params.productId,
    productTitle: params.productTitle,
    productUrl: params.productUrl,
  });

  const qty = Math.max(1, params.quantity ?? 1);
  const customizationGbp = customizationFeeGbp(params.customizationPrompt, params.includePreview !== false);
  const apiGbp = params.includePreview !== false ? apiCostGbp() : 0;
  const bundleLineTotal = Math.round(pricing.bundleGbp * qty * 100) / 100;

  const lineItems: PriceLineItem[] = [
    {
      label: `${pricing.title} × ${qty} bundle${qty > 1 ? "s" : ""}`,
      amount: bundleLineTotal,
      currency: "GBP",
      kind: "bundle",
      detail: `${pricing.priceLabel} · ~£${pricing.pricePerPieceGbp.toFixed(2)}/pc · ${pricing.piecesPerBundle} pcs/bundle`,
    },
  ];

  if (params.includePreview !== false) {
    lineItems.push({
      label: "AI alteration preview",
      amount: customizationGbp,
      currency: "GBP",
      kind: "customization",
      detail: `Gemini styling + image edit (~£${apiGbp.toFixed(2)} API cost)`,
    });
  }

  const subtotal = Math.round(lineItems.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  let discount = 0;
  let promoApplied: string | undefined;

  if (params.promoCode) {
    const promo = PROMO_CODES[params.promoCode.trim().toUpperCase()];
    if (promo) {
      discount = promo.discountGbp;
      promoApplied = promo.label;
      lineItems.push({
        label: promo.label,
        amount: -discount,
        currency: "GBP",
        kind: "discount",
      });
    }
  }

  const total = Math.round(Math.max(subtotal - discount, 0) * 100) / 100;
  const totalPieces = qty * pricing.piecesPerBundle;

  return {
    line_items: lineItems,
    subtotal,
    discount,
    total,
    currency: "GBP",
    api_cost_gbp: apiGbp,
    customization_fee_gbp: customizationGbp,
    bundle_price_gbp: bundleLineTotal,
    promo_applied: promoApplied,
    quantity: qty,
    unit_price_gbp: pricing.bundleGbp,
    price_per_piece_gbp: pricing.pricePerPieceGbp,
    pieces_per_bundle: pricing.piecesPerBundle,
    total_pieces: totalPieces,
    notes: [
      `Ordering ${qty} bundle(s) = ${totalPieces} pieces total`,
      `Bundle sourced from ${pricing.url}`,
      "AI preview uses gemini-3.1-flash-image at 1K (~$0.067/image per Google pricing).",
    ],
  };
}

export function demoCreateMockOrder(params: {
  productId: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
  quantity?: number;
  itemId?: string;
}): MockOrder {
  const pricing = resolvePiecePricing({
    itemId: params.itemId ?? params.productId,
    productId: params.productId,
    productTitle: params.productTitle,
    productUrl: params.productUrl,
  });
  const estimate = demoEstimateOrder(params);
  const orderId = `ord_demo_${Math.random().toString(36).slice(2, 10)}`;

  return {
    order_id: orderId,
    status: "confirmed",
    product_id: params.productId,
    product_title: pricing.title,
    customization_prompt: params.customizationPrompt,
    estimate,
    checkout_url: pricing.url,
    created_at: new Date().toISOString(),
    message: `Mock order for ${estimate.quantity ?? 1} bundle(s) (${estimate.total_pieces ?? 0} pcs) — complete on Fleek.`,
  };
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}
