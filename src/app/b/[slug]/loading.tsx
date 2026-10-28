/**
 * Loading de Vitrina en tono claro. Debe parecerse a la página final: un
 * skeleton oscuro (Nocturne) aquí produce un flash muy visible.
 */

const bar = "rounded-md bg-[#EDE4D8] animate-pulse";

export default function VitrinaLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando página del salón"
      className="min-h-screen bg-[#FBF7F0] pb-28 text-[#17110F]"
    >
      <span className="sr-only">Cargando página del salón…</span>

      <div className="border-b border-[#E8E0D5] bg-[#FBF7F0]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-[1180px] items-center gap-3 px-5 sm:px-8">
          <div className={`h-9 w-9 rounded-full ${bar}`} />
          <div className="space-y-1.5">
            <div className={`h-3.5 w-40 ${bar}`} />
            <div className={`h-2 w-24 ${bar}`} />
          </div>
          <div className={`ml-auto h-9 w-24 rounded-full ${bar}`} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#6D1F16] via-[#B3402C] to-[#D1613F]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-4">
            <div className="h-2.5 w-28 rounded bg-white/25" />
            <div className="h-12 w-full max-w-md rounded bg-white/25" />
            <div className="h-12 w-3/4 max-w-xs rounded bg-white/25" />
            <div className="h-3 w-full max-w-sm rounded bg-white/20" />
            <div className="h-3 w-4/5 max-w-xs rounded bg-white/20" />
            <div className="flex gap-3 pt-3">
              <div className="h-11 w-40 rounded-full bg-white/70" />
              <div className="h-11 w-32 rounded-full bg-white/20" />
            </div>
          </div>

          <div className="hidden aspect-[4/3] rounded-3xl bg-white/15 lg:block" />
        </div>
      </div>

      <div className="bg-[#17110F]">
        <div className="mx-auto flex w-full max-w-[1180px] gap-6 px-5 py-3.5 sm:px-8">
          <div className="h-2.5 w-24 rounded bg-white/25" />
          <div className="h-2.5 w-20 rounded bg-white/25" />
          <div className="h-2.5 w-28 rounded bg-white/25" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] space-y-6 px-5 py-14 sm:px-8">
        <div className="space-y-2">
          <div className={`h-2.5 w-20 ${bar}`} />
          <div className={`h-8 w-72 max-w-full ${bar}`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-[#E8E0D5] bg-white"
            >
              <div className="h-40 w-full animate-pulse bg-[#EDE4D8]" />
              <div className="space-y-3 p-4">
                <div className={`h-4 w-2/3 ${bar}`} />
                <div className={`h-3 w-full ${bar}`} />
                <div className={`h-3 w-4/5 ${bar}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#E8E0D5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-2.5 px-5 py-3 sm:px-8">
          <div className={`h-11 flex-1 ${bar}`} />
          <div className={`hidden h-11 flex-1 sm:block ${bar}`} />
          <div className={`hidden h-11 flex-1 sm:block ${bar}`} />
          <div className="h-11 w-28 flex-none animate-pulse rounded-full bg-[#B3402C]/40" />
        </div>
      </div>
    </div>
  );
}
