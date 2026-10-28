export default function AdminLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando panel de administración"
      className="p-5 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto"
    >
      <span className="sr-only">Cargando panel de administración…</span>

      {/* Encabezado */}
      <div className="space-y-3 pb-5 border-b border-border">
        <div className="skeleton h-3 w-44" />
        <div className="skeleton h-8 w-64 max-w-full" />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-3">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-12 rounded-xl" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="skeleton h-56 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
