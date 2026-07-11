/** Mock pricing — mirrors backend part2_customizer/pricing.py for demo mode */

import type { MockOrder, PriceEstimate, PriceLineItem } from "./types";

const GEMINI_IMAGE_COST_USD = 0.067;
const GEMINI_STYLING_COST_USD = 0.003;
const USD_TO_GBP = 0.79;
const CUSTOMIZATION_BASE_GBP = 4.99;

const CATEGORY_BUNDLE_GBP: Record<string, number> = {
  tie: 328,
  "t-shirt": 103,
  hoodie: 119,
  jeans: 109,
  jacket: 409,
  shorts: 135,
};

const PRODUCT_PRICING: Record<
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
  "fleek-y2k-baby-tee": {
    title: "Y2K Graphic Baby Tees",
    bundleGbp: Math.round(103 * USD_TO_GBP * 100) / 100,
    label: "$103",
    pieces: 10,
    url: "https://joinfleek.com",
  },
};

const PROMO_CODES: Record<string, { discountGbp: number; label: string }> = {
  APPFIRSTORDER: { discountGbp: 20, label: "£20 off first app order" },
};

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

function resolveProduct(productId: string, fallbackTitle?: string, fallbackUrl?: string) {
  const known = PRODUCT_PRICING[productId];
  if (known) return known;
  const category = productId.includes("tie") ? "tie" : "t-shirt";
  return {
    title: fallbackTitle ?? "Fleek wholesale bundle",
    bundleGbp: CATEGORY_BUNDLE_GBP[category] ?? 150,
    label: "Wholesale bundle",
    url: fallbackUrl ?? "https://joinfleek.com",
  };
}

export function demoEstimateOrder(params: {
  productId: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
}): PriceEstimate {
  const product = resolveProduct(params.productId, params.productTitle, params.productUrl);
  const customizationGbp = customizationFeeGbp(params.customizationPrompt, params.includePreview !== false);
  const apiGbp = params.includePreview !== false ? apiCostGbp() : 0;

  const lineItems: PriceLineItem[] = [
    {
      label: product.title,
      amount: product.bundleGbp,
      currency: "GBP",
      kind: "bundle",
      detail: product.label,
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
  const notes = [
    `Bundle sourced from ${product.url}`,
    "AI preview uses gemini-3.1-flash-image at 1K (~$0.067/image per Google pricing).",
  ];
  if (product.pieces) {
    notes.push(`~£${(product.bundleGbp / product.pieces).toFixed(2)}/piece on ${product.pieces}-piece bundle (MOQ).`);
  }

  return {
    line_items: lineItems,
    subtotal,
    discount,
    total,
    currency: "GBP",
    api_cost_gbp: apiGbp,
    customization_fee_gbp: customizationGbp,
    bundle_price_gbp: product.bundleGbp,
    promo_applied: promoApplied,
    notes,
  };
}

export function demoCreateMockOrder(params: {
  productId: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
}): MockOrder {
  const product = resolveProduct(params.productId, params.productTitle, params.productUrl);
  const estimate = demoEstimateOrder(params);
  const orderId = `ord_demo_${Math.random().toString(36).slice(2, 10)}`;

  return {
    order_id: orderId,
    status: "confirmed",
    product_id: params.productId,
    product_title: product.title,
    customization_prompt: params.customizationPrompt,
    estimate,
    checkout_url: product.url,
    created_at: new Date().toISOString(),
    message: "Mock order placed — redirect to Fleek to complete wholesale purchase.",
  };
}
