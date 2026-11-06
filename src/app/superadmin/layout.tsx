import { requireSuperadmin } from "@/lib/superadmin";
import { SuperadminSidebar } from "@/components/SuperadminSidebar";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperadmin();

  return (
    <div className="min-h-screen bg-base text-foreground">
      <SuperadminSidebar email={session.email} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="p-5 sm:p-8 flex-1 w-full max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
