/**
 * Loading de Vitrina. Es un skeleton neutro de papel: no consulta la base
 * (loading no recibe `params`) y sirve para cualquiera de los temas claros.
 */

const bar = "animate-pulse rounded-[2px] bg-[#E2DCCE]";

export default function VitrinaLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando página del salón"
      className="min-h-screen bg-[#F4F1EA] pb-28 text-[#121210]"
    >
      <span className="sr-only">Cargando página del salón…</span>

      <div className="border-b border-[#E2DCCE] bg-[#F4F1EA]">
        <div className="mx-auto flex min-h-16 w-full max-w-[1180px] items-center gap-3 px-5 sm:px-8">
          <div className={`h-9 w-9 ${bar}`} />
          <div className="space-y-1.5">
            <div className={`h-3.5 w-40 ${bar}`} />
            <div className={`h-2 w-24 ${bar}`} />
          </div>
          <div className={`ml-auto h-9 w-24 ${bar}`} />
        </div>
      </div>

      <div className="bg-[#E2DCCE]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-4">
            <div className="h-2.5 w-28 rounded bg-[#F4F1EA]/70" />
            <div className="h-12 w-full max-w-md rounded bg-[#F4F1EA]/70" />
            <div className="h-12 w-3/4 max-w-xs rounded bg-[#F4F1EA]/70" />
            <div className="h-3 w-full max-w-sm rounded bg-[#F4F1EA]/50" />
            <div className="h-3 w-4/5 max-w-xs rounded bg-[#F4F1EA]/50" />
            <div className="flex gap-3 pt-3">
              <div className="h-11 w-40 rounded-[3px] bg-[#121210]" />
              <div className="h-11 w-32 rounded-[3px] bg-[#F4F1EA]/60" />
            </div>
          </div>

          <div className="hidden aspect-[4/3] rounded-[4px] bg-[#F4F1EA]/40 lg:block" />
        </div>
      </div>

      <div className="bg-[#121210]">
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
              className="overflow-hidden rounded-[3px] border border-[#E2DCCE] bg-[#FAF8F3]"
            >
              <div className="h-40 w-full animate-pulse bg-[#E2DCCE]" />
              <div className="space-y-3 p-4">
                <div className={`h-4 w-2/3 ${bar}`} />
                <div className={`h-3 w-full ${bar}`} />
                <div className={`h-3 w-4/5 ${bar}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#E2DCCE] bg-[#FAF8F3]">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 py-3 sm:px-8">
          <div className="h-10 flex-1 animate-pulse rounded-full bg-[#E2DCCE]" />
          <div className="h-11 w-28 flex-none animate-pulse rounded-[3px] bg-[#121210]/30" />
        </div>
      </div>
    </div>
  );
}
