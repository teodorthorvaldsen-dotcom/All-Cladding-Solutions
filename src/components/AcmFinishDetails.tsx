import Link from "next/link";
import type { AcmColor, MetricValue } from "@/data/acm";
import { finishSeriesLabels } from "@/data/acm";

function fmtMetric(v: MetricValue): string {
  return v === "N/A" ? "N/A" : typeof v === "number" ? String(v) : String(v);
}

export function AcmFinishDetails({ color }: { color: AcmColor }) {
  const w = color.warrantyYears;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gray-800">
        Finish performance — selected color
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
        Product line: <span className="font-medium text-gray-700">Alfrex FR MCM</span> (values from Alfrex F-01
        stocking table where published).
      </p>

      <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Series type</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{finishSeriesLabels[color.finishSeries]}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Standard stocking</dt>
          <dd className="mt-0.5 font-medium text-gray-900">
            {color.standardStocking ? "Yes — 4 mm FR MCM & matching 0.040″ sheet" : "No — MOQ / special order"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Finish warranty (years)</dt>
          <dd className="mt-0.5 font-medium text-gray-900">
            {w == null ? "Quoted per match" : `${w}-year`}
            {color.warrantyNote ? (
              <span className="mt-1 block text-[12px] font-normal text-gray-600">{color.warrantyNote}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Daylight reflectivity (%)</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{fmtMetric(color.daylightReflectivity)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">LRV (approx.)</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{fmtMetric(color.lrv)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">SRI (approx.)</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{fmtMetric(color.sri)}</dd>
        </div>
        {color.rgbApprox ? (
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Catalog RGB reference</dt>
            <dd className="mt-0.5 font-mono text-[12px] text-gray-800">{color.rgbApprox}</dd>
          </div>
        ) : null}
      </dl>

      {color.isCustomMatch ? (
        <p className="mt-4 text-[12px] leading-relaxed text-gray-600">
          Custom matches are quoted with your submittal. Alfrex notes that perfect matches are not always
          possible across substrates and paint systems; specify performance requirements with your sample.
        </p>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
        See full finish plates and disclaimers in{" "}
        <Link
          href="/documents/F-01-Alfrex-Standard-Product-Finishes.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700"
        >
          F-01 Standard Product Finishes (PDF)
        </Link>
        .
      </p>
    </div>
  );
}
