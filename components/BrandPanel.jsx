import Link from 'next/link';

export default function BrandPanel({ title, description, actionLabel, actionHref, darkAction = false }) {
  return (
    <section
      aria-label="Slipcord brand"
      className="relative aspect-[569/640] w-full overflow-hidden select-none md:aspect-auto md:h-screen md:min-h-screen md:w-1/2 lg:w-[55.5%]"
      style={{
        background: 'repeating-linear-gradient(to right, #0b5d3b 0px, #0b5d3b 68px, #0e6b44 68px, #0e6b44 136px)',
      }}
    >
      <svg
        role="img"
        aria-label="Slipcord"
        viewBox="0 0 100 100"
        className="absolute left-1/2 top-[21.8%] w-[52%] max-w-[354px] -translate-x-1/2"
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8" />
        <path
          d="M66 15C56 21 39 31 33 41c-7 12 3 17 18 21 15 4 18 11 10 20-7 8-18 14-29 20"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
        />
      </svg>

      <div className="absolute left-1/2 top-[70.8%] flex h-[70px] w-[min(92%,444px)] -translate-x-1/2 items-center justify-between rounded-[18px] bg-[#f7f8f2] px-[18px] shadow-sm lg:w-[min(82%,444px)]">
        <div className="min-w-0">
          <p className="text-base font-bold leading-5 text-[#153f2f]">{title}</p>
          <p className="mt-0.5 text-[13px] leading-4 text-[#62776c]">{description}</p>
        </div>
        <Link
          href={actionHref}
          className={`ml-3 flex h-[39px] shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold text-white transition-colors ${
            darkAction ? 'bg-[#0b3d2a] hover:bg-[#072a1c]' : 'bg-[#1a9657] hover:bg-[#147d49]'
          }`}
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
