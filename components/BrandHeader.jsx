export default function BrandHeader() {
  return (
    <a
      href="/"
      aria-label="Slipcord home"
      className="flex w-fit items-center gap-3 text-[#0b3d2a] md:absolute md:left-[10%] md:top-[6.5%] lg:left-[15.5%]"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-8 w-8">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#1b9859" strokeWidth="3.5" />
        <path d="M30 10c-5 3-13 8-14 13-1 4 5 6 10 7 6 2 6 5 3 8-3 3-7 5-11 7" fill="none" stroke="#1b9859" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xl font-bold tracking-tight">Slipcord</span>
    </a>
  );
}
