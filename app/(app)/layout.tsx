import { requireSession } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <AppHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <main className="container flex-1 py-6">{children}</main>
    </div>
  );
}
