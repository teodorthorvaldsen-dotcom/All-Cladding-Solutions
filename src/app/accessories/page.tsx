"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { accessoryCatalog } from "@/data/accessories";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/types/cart";

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

/** Placeholder color id for cart schema (not shown for accessory lines). */
const ACCESSORY_SCHEMA_COLOR_ID = "classic-white";

function accessoryToCartPayload(entry: (typeof accessoryCatalog)[number], quantity: number): Omit<CartItem, "id"> {
  return {
    productKind: "accessory",
    productLabel: entry.title,
    accessoryDetail: entry.description,
    widthIn: 0,
    heightIn: 0,
    standardId: null,
    colorId: ACCESSORY_SCHEMA_COLOR_ID,
    finishId: "standard",
    thicknessId: "4mm",
    quantity,
    unitPrice: entry.unitPrice,
    areaFt2: 0,
    panelTypeLabel: "Accessory",
  };
}

export default function AccessoriesPage() {
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(accessoryCatalog.map((a) => [a.id, 1]))
  );
  const [addedId, setAddedId] = useState<string | null>(null);

  const setQty = useCallback((id: string, next: number) => {
    const n = Number(next);
    const q = !Number.isFinite(n) ? 0 : Math.max(0, Math.floor(n));
    setQuantities((prev) => ({ ...prev, [id]: q }));
  }, []);

  const bump = useCallback((id: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] ?? 0;
      return { ...prev, [id]: Math.max(0, cur + delta) };
    });
  }, []);

  const handleAdd = useCallback(
    (entry: (typeof accessoryCatalog)[number]) => {
      const qty = quantities[entry.id] ?? 0;
      if (qty < 1) return;
      addItem(accessoryToCartPayload(entry, qty));
      setAddedId(entry.id);
      window.setTimeout(() => setAddedId((id) => (id === entry.id ? null : id)), 2200);
    },
    [addItem, quantities]
  );

  const cards = useMemo(
    () =>
      accessoryCatalog.map((entry) => {
        const qty = quantities[entry.id] ?? 0;
        const lineEst = entry.unitPrice * qty;
        const canAdd = qty >= 1;
        return (
          <article
            key={entry.id}
            className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">{entry.title}</h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-gray-600">{entry.description}</p>
            <p className="mt-4 text-sm text-gray-500">
              Estimated <span className="font-medium text-gray-800">{formatUSD(entry.unitPrice)}</span> each — final
              price on your quote.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-0.5">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-semibold text-gray-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                  aria-label={`Decrease quantity for ${entry.title}`}
                  onClick={() => bump(entry.id, -1)}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setQty(entry.id, Number(e.target.value))}
                  className="h-10 min-w-[3.25rem] border-0 bg-transparent text-center text-[15px] font-medium tabular-nums text-gray-900 focus:outline-none focus:ring-0"
                  aria-label={`Quantity for ${entry.title}`}
                />
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-semibold text-gray-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                  aria-label={`Increase quantity for ${entry.title}`}
                  onClick={() => bump(entry.id, 1)}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                Line est. <span className="font-medium text-gray-800">{formatUSD(lineEst)}</span>
              </span>
            </div>
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => handleAdd(entry)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-200 sm:w-auto"
            >
              Add to cart
            </button>
            {addedId === entry.id ? (
              <p className="mt-2 text-sm font-medium text-emerald-700" role="status">
                Added to cart.{" "}
                <Link href="/cart" className="underline underline-offset-2 hover:text-emerald-900">
                  View cart
                </Link>
              </p>
            ) : null}
          </article>
        );
      }),
    [addedId, bump, handleAdd, quantities, setQty]
  );

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Accessories</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">
        Order clips and fasteners by quantity below. Items appear in your cart like panels and flashing; submit an
        estimate request at checkout and we will confirm compatibility, counts, and final pricing.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">{cards}</div>
      <p className="mt-10 text-sm text-gray-500">
        Need something else? Add a note at checkout or{" "}
        <Link href="/consultation" className="font-medium text-gray-800 underline underline-offset-2 hover:text-gray-950">
          contact us
        </Link>
        .
      </p>
    </main>
  );
}
