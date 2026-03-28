import Image from "next/image";

const CHART_PATH = "/images/acm/alfrex-2-coat-solids.png";

export function TwoCoatSolidsShowcase() {
  return (
    <section
      className="mt-20 border-t border-gray-200/80 pt-16"
      aria-labelledby="two-coat-solids-heading"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="two-coat-solids-heading"
            className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
          >
            2 Coat Solids
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-gray-500">
            Alfrex FR standard stocking colors with matching{" "}
            <span className="whitespace-nowrap">0.040″</span> flat sheet in inventory. Non-directional
            finishes — solids do not require directional film alignment.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-900 px-3 py-1 text-[12px] font-medium text-white">
          30 Year Finish Warranty
        </span>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-gray-800">
          AAMA 2605
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[12px] font-medium text-emerald-900">
          Standard stock — matching flat sheet in inventory
        </span>
      </div>

      <figure className="mt-10 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="relative w-full">
          <Image
            src={CHART_PATH}
            alt="Alfrex 2 Coat Solids: Classic White JY-5195 through Midnight Black JY-6230, with product codes on each swatch."
            width={1200}
            height={680}
            className="h-auto w-full object-contain"
            sizes="(max-width: 1152px) 100vw, 1152px"
            priority={false}
          />
        </div>
        <figcaption className="border-t border-gray-100 px-4 py-3 text-center text-[12px] text-gray-500 sm:px-6">
          Finish chart from Alfrex standard product literature. Confirm final color with physical samples before
          fabrication.
        </figcaption>
      </figure>
    </section>
  );
}
