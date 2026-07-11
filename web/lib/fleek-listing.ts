import type { FleekListing } from "./types";

const USD_TO_GBP = 0.79;

export function listingPricePerPieceGbp(listing: FleekListing): number | null {
  if (listing.price_per_piece_gbp != null) return listing.price_per_piece_gbp;
  if (listing.price_amount != null && listing.pieces) {
    return Math.round(((listing.price_amount * USD_TO_GBP) / listing.pieces) * 100) / 100;
  }
  return null;
}

export function listingBundleGbp(listing: FleekListing): number | null {
  if (listing.price_amount != null) {
    return Math.round(listing.price_amount * USD_TO_GBP * 100) / 100;
  }
  return null;
}

export function bundleToListing(b: {
  product_id?: string;
  title: string;
  url: string;
  price?: string;
  match_score?: number;
  image_url?: string;
  pieces?: number;
  price_amount?: number;
}): FleekListing {
  const bundleGbp = b.price_amount
    ? Math.round(b.price_amount * USD_TO_GBP * 100) / 100
    : undefined;
  const ppc =
    b.price_amount && b.pieces
      ? Math.round(((b.price_amount * USD_TO_GBP) / b.pieces) * 100) / 100
      : undefined;
  return {
    product_id: b.product_id,
    title: b.title,
    url: b.url,
    price: b.price,
    match_score: b.match_score,
    image_url: b.image_url,
    pieces: b.pieces,
    price_amount: b.price_amount,
    price_per_piece_gbp: ppc,
    bundle_gbp: bundleGbp,
  };
}

export function defaultSelectionsFromAnalysis(
  items: { id: string; fleek_lookup: { relevant_bundles: Parameters<typeof bundleToListing>[0][] } }[]
): Record<string, FleekListing> {
  const out: Record<string, FleekListing> = {};
  for (const item of items) {
    const first = item.fleek_lookup.relevant_bundles[0];
    if (first) out[item.id] = bundleToListing(first);
  }
  return out;
}

export function fleekSearchUrl(term: string): string {
  const q = encodeURIComponent(term.trim()).replace(/%20/g, "+");
  return `https://joinfleek.com/search?q=${q}&options[prefix]=last`;
}
