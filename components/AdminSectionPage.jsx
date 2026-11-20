export default function AdminSectionPage({ title, description }) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Admin portal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-[#6b7280]">{description}</p>
      </div>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-[#374151]">Nothing to manage yet</p>
        <p className="mt-2 text-sm text-[#6b7280]">
          This section is ready for its management features.
        </p>
      </section>
    </div>
  );
}
