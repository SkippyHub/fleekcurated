"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { estimateOrder, placeMockOrder } from "@/lib/api";
import { formatGbp, resolvePiecePricing } from "@/lib/pricing";
import type { MockOrder, PriceEstimate } from "@/lib/types";

interface Props {
  itemId: string;
  itemLabel: string;
  productId: string;
  customizationPrompt: string;
  productTitle: string;
  productUrl: string;
  includePreview?: boolean;
  compact?: boolean;
}

export default function OrderReview({
  itemId,
  itemLabel,
  productId,
  customizationPrompt,
  productTitle,
  productUrl,
  includePreview = true,
  compact = false,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState("APPFIRSTORDER");
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"demo" | "api">("demo");

  const piecePricing = useMemo(
    () =>
      resolvePiecePricing({
        itemId,
        productId,
        productTitle,
        productUrl,
      }),
    [itemId, productId, productTitle, productUrl]
  );

  const loadEstimate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { estimate: data, source: src } = await estimateOrder({
        productId,
        itemId,
        customizationPrompt,
        promoCode: promoCode.trim() || undefined,
        includePreview,
        productTitle,
        productUrl,
        quantity,
      });
      setEstimate(data);
      setSource(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load estimate.");
    } finally {
      setLoading(false);
    }
  }, [
    productId,
    itemId,
    customizationPrompt,
    promoCode,
    includePreview,
    productTitle,
    productUrl,
    quantity,
  ]);

  useEffect(() => {
    loadEstimate();
  }, [loadEstimate]);

  async function handlePlaceOrder() {
    setOrdering(true);
    setError(null);
    try {
      const { order: data, source: src } = await placeMockOrder({
        productId,
        itemId,
        customizationPrompt,
        promoCode: promoCode.trim() || undefined,
        includePreview,
        productTitle,
        productUrl,
        quantity,
      });
      setOrder(data);
      setEstimate(data.estimate);
      setSource(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed.");
    } finally {
      setOrdering(false);
    }
  }

  const totalPieces = quantity * piecePricing.piecesPerBundle;

  return (
    <div className={compact ? "mt-5 border-t border-fleek-border pt-5" : "surface-card rounded-md p-6 sm:p-7"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className={`font-semibold text-fleek-text ${compact ? "text-base" : "text-lg"}`}>
            {compact ? "Order this piece" : "Review & order"}
          </h3>
          <p className="mt-1 text-sm text-fleek-muted">
            {itemLabel} · {piecePricing.title}
          </p>
        </div>
        {estimate && (
          <span className="shrink-0 rounded-full bg-fleek-bg border border-fleek-border px-2 py-0.5 text-[10px] font-medium uppercase text-fleek-muted">
            {source} pricing
          </span>
        )}
      </div>

      {/* Unit economics */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-fleek-border bg-fleek-bg p-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-fleek-muted">Per bundle</p>
          <p className="mt-0.5 text-sm font-semibold text-fleek-text">
            {formatGbp(piecePricing.bundleGbp)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-fleek-muted">Per piece</p>
          <p className="mt-0.5 text-sm font-semibold text-tiger-gold">
            {formatGbp(piecePricing.pricePerPieceGbp)}
          </p>
          <p className="text-[9px] text-fleek-muted">{piecePricing.piecesPerBundle} pcs MOQ</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-fleek-muted">Your order</p>
          <p className="mt-0.5 text-sm font-semibold text-fleek-text">{totalPieces} pcs</p>
          <p className="text-[9px] text-fleek-muted">{quantity} bundle{quantity > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Quantity */}
      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fleek-muted">
          How many bundles?
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-fleek-border bg-fleek-surface text-lg font-medium hover:border-tiger-gold/40"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="input-fleek w-20 rounded-md px-3 py-2 text-center text-sm font-semibold"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-fleek-border bg-fleek-surface text-lg font-medium hover:border-tiger-gold/40"
            aria-label="Increase quantity"
          >
            +
          </button>
          <p className="text-sm text-fleek-muted">
            = <span className="font-semibold text-fleek-text">{formatGbp(piecePricing.bundleGbp * quantity)}</span>{" "}
            wholesale
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fleek-muted">
            Promo code
          </span>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="APPFIRSTORDER"
            className="input-fleek w-full rounded-md px-4 py-2.5 text-sm uppercase"
          />
        </label>
        <button
          type="button"
          onClick={loadEstimate}
          disabled={loading}
          className="rounded-full border border-fleek-border bg-fleek-surface px-5 py-2.5 text-sm font-medium text-fleek-text hover:border-tiger-gold/40 disabled:opacity-50"
        >
          {loading ? "Updating…" : "Refresh estimate"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-chili-red/10 px-3 py-2 text-sm text-chili-red">{error}</p>
      )}

      {loading && !estimate && (
        <div className="mt-5 space-y-2 animate-pulse">
          <div className="h-4 w-1/3 rounded bg-fleek-border" />
          <div className="h-16 rounded bg-fleek-border" />
        </div>
      )}

      {estimate && (
        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-fleek-border bg-fleek-bg p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
              Cost breakdown
            </p>
            <ul className="mt-3 space-y-2">
              {estimate.line_items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="text-fleek-text">{item.label}</p>
                    {item.detail && <p className="text-xs text-fleek-muted">{item.detail}</p>}
                  </div>
                  <span
                    className={`shrink-0 font-medium ${
                      item.kind === "discount" ? "text-chili-red" : "text-fleek-text"
                    }`}
                  >
                    {item.kind === "discount" ? "−" : ""}
                    {formatGbp(Math.abs(item.amount))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1 border-t border-fleek-border pt-3 text-sm">
              <div className="flex justify-between text-fleek-muted">
                <span>Subtotal</span>
                <span>{formatGbp(estimate.subtotal)}</span>
              </div>
              {estimate.discount > 0 && (
                <div className="flex justify-between text-chili-red">
                  <span>Discount</span>
                  <span>−{formatGbp(estimate.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-fleek-text">
                <span>Estimated total</span>
                <span className="text-tiger-gold">{formatGbp(estimate.total)}</span>
              </div>
            </div>
          </div>

          {!order ? (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={ordering}
              className="w-full rounded-full bg-tiger-gold py-3 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90 disabled:opacity-50"
            >
              {ordering
                ? "Placing order…"
                : `Place order — ${quantity} bundle${quantity > 1 ? "s" : ""} (${totalPieces} pcs)`}
            </button>
          ) : (
            <div className="rounded-md border border-tiger-gold/30 bg-tiger-gold/10 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tiger-gold text-sm font-bold text-charred-clove">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-fleek-text">Order confirmed</p>
                  <p className="text-xs text-fleek-muted">{order.order_id}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-fleek-muted">{order.message}</p>
              <p className="mt-2 text-sm">
                <span className="text-fleek-muted">Total: </span>
                <span className="font-semibold text-tiger-gold">{formatGbp(order.estimate.total)}</span>
              </p>
              <a
                href={order.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tiger-gold px-5 py-2.5 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90 sm:w-auto"
              >
                Complete on joinfleek.com →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
