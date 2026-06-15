import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <BrandLogo />
        <p className="text-sm text-muted-foreground">
          Онлайн блокнот для управления задачами
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
