import Image from "next/image";
import Link from "next/link";
import { AboutNarrative } from "@/components/AboutNarrative";

const TRUST_ITEMS = [
  {
    title: "Lead times",
    description: "Confirmed with your quote based on project size, finish, and delivery location.",
  },
  {
    title: "Nationwide",
    description: "We ship across the United States. Delivery options and pricing with your quote.",
  },
  {
    title: "Fire-rated ACM",
    description: "Meets building codes for exterior applications.",
  },
  {
    title: "Installation",
    description: "We recommend installers that can bid your project.",
  },
];

const CAPABILITIES = [
  { title: "ACM Panels", description: "Fire-rated aluminum composite material. Configure and quote online. Nationwide." },
  { title: "Custom Shop Drawings", description: "Inquire about purchasing shop drawings prepared by our team." },
  { title: "Nationwide", description: "Shipping across the United States. Delivery options and pricing with your quote." },
  { title: "Installation", description: "We recommend installers that can bid your project." },
];

const PRODUCT_HIGHLIGHTS = [
  {
    title: "ACM Panels",
    description: "Fire-rated aluminum composite material. Configure online and receive a quote.",
    href: "/products/acm-panels",
    cta: "Configure & get estimate",
  },
  {
    title: "Custom Shop Drawings",
    description: "Inquire about purchasing shop drawings prepared by our team.",
    href: "/custom-shop-drawings",
    cta: "Inquire about shop drawings",
  },
  {
    title: "Installation",
    description: "We recommend installers that can bid your project.",
    href: "/consultation",
    cta: "Recommend installers",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="Modern architectural facade with ACM panels"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,rgba(0,0,0,0.25)_100%)]"
          aria-hidden
        />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-3xl text-white">
            <h1 className="animate-hero-fade-in text-[2.75rem] font-semibold tracking-[-0.03em] md:text-[4.25rem] lg:text-[5rem]">
              ACM Panels & Cladding
            </h1>
            <p className="mt-6 animate-hero-fade-in text-lg text-white/90 md:text-xl [animation-delay:0.15s]">
              Fire-rated ACM panels. Configure online or submit drawings for consultation. Nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section
        className="border-y border-gray-200 bg-white"
        aria-label="Capabilities"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="text-center sm:text-left">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product highlights */}
      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-32">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Products & services
        </h2>
        <p className="mt-2 text-[15px] text-gray-500">
          Fire-rated ACM panels. Configure online or submit drawings for consultation.
        </p>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_HIGHLIGHTS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-gray-200/60 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-gray-300/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              <h3 className="text-[17px] font-medium text-gray-900 group-hover:text-gray-800">
                {card.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                {card.description}
              </p>
              <span className="mt-4 inline-block text-[13px] font-medium text-gray-900 group-hover:underline">
                {card.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section
        className="bg-[#0f0f10] py-28 lg:py-32"
        aria-labelledby="capabilities-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="capabilities-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Capabilities
          </h2>
          <p className="mt-2 text-[15px] text-gray-400">
            Capabilities and service scope.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.08] px-8 py-10 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.02]"
              >
                <h3 className="text-[15px] font-medium text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        className="border-t border-gray-200 bg-white py-28 lg:py-32"
        aria-labelledby="home-about-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="home-about-heading"
            className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
          >
            About All Cladding Solutions
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] text-gray-500">
            Fabrication, supply, and support for fire-rated ACM panels nationwide.
          </p>
          <div className="mx-auto mt-10 max-w-3xl">
            <AboutNarrative />
          </div>
        </div>
      </section>
    </div>
  );
}
