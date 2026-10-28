export default function PublicBookingLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando portal de reservas"
      className="min-h-screen bg-base"
    >
      <span className="sr-only">Cargando portal de reservas…</span>

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 h-14 flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-40" />
            <div className="skeleton h-2 w-24" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 space-y-3">
          <div className="skeleton h-2.5 w-32" />
          <div className="skeleton h-9 w-2/3 max-w-sm" />
          <div className="skeleton h-3 w-full max-w-md" />
          <div className="skeleton h-3 w-4/5 max-w-sm" />
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 min-w-0 space-y-6">
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-[420px] rounded-2xl" />
        </div>
        <div className="hidden lg:block lg:col-span-4">
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
