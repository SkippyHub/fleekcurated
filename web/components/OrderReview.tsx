"use client";

import { useCallback, useEffect, useState } from "react";
import { estimateOrder, placeMockOrder } from "@/lib/api";
import type { MockOrder, PriceEstimate } from "@/lib/types";

interface Props {
  productId: string;
  customizationPrompt: string;
  productTitle: string;
  productUrl: string;
}

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default function OrderReview({
  productId,
  customizationPrompt,
  productTitle,
  productUrl,
}: Props) {
  const [promoCode, setPromoCode] = useState("APPFIRSTORDER");
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"demo" | "api">("demo");

  const loadEstimate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { estimate: data, source: src } = await estimateOrder({
        productId,
        customizationPrompt,
        promoCode: promoCode.trim() || undefined,
        includePreview: true,
        productTitle,
        productUrl,
      });
      setEstimate(data);
      setSource(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load estimate.");
    } finally {
      setLoading(false);
    }
  }, [productId, customizationPrompt, promoCode, productTitle, productUrl]);

  useEffect(() => {
    loadEstimate();
  }, [loadEstimate]);

  async function handlePlaceOrder() {
    setOrdering(true);
    setError(null);
    try {
      const { order: data, source: src } = await placeMockOrder({
        productId,
        customizationPrompt,
        promoCode: promoCode.trim() || undefined,
        includePreview: true,
        productTitle,
        productUrl,
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

  return (
    <div className="surface-card rounded-md p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-fleek-text">5. Review & order</h3>
          <p className="mt-1 text-sm text-fleek-muted">
            Estimated wholesale bundle + AI alteration preview cost
          </p>
        </div>
        {estimate && (
          <span className="shrink-0 rounded-full bg-fleek-bg border border-fleek-border px-2 py-0.5 text-[10px] font-medium uppercase text-fleek-muted">
            {source} pricing
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
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
                    {item.detail && (
                      <p className="text-xs text-fleek-muted">{item.detail}</p>
                    )}
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

          <div className="rounded-md border border-tiger-gold/25 bg-tiger-gold/5 p-4 text-xs text-fleek-muted">
            <p className="font-medium text-fleek-text">Gemini API cost (transparent)</p>
            <p className="mt-1">
              ~{formatGbp(estimate.api_cost_gbp)} per preview ·{" "}
              <a
                href="https://ai.google.dev/gemini-api/docs/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fleek-text hover:text-tiger-gold hover:underline"
              >
                Google pricing
              </a>{" "}
              ($0.067/image at 1K for gemini-3.1-flash-image)
            </p>
            {estimate.notes.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                {estimate.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          {!order ? (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={ordering}
              className="w-full rounded-full bg-tiger-gold py-3 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90 disabled:opacity-50"
            >
              {ordering ? "Placing mock order…" : "Place mock order →"}
            </button>
          ) : (
            <div className="rounded-md border border-tiger-gold/30 bg-tiger-gold/10 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tiger-gold text-sm font-bold text-charred-clove">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-fleek-text">Mock order confirmed</p>
                  <p className="text-xs text-fleek-muted">{order.order_id}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-fleek-muted">{order.message}</p>
              <p className="mt-2 text-sm">
                <span className="text-fleek-muted">Total: </span>
                <span className="font-semibold text-tiger-gold">
                  {formatGbp(order.estimate.total)}
                </span>
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
