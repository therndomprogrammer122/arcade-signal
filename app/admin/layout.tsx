import AdminSessionProvider from "@/components/AdminSessionProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // El panel /admin conserva el tema claro editorial original. La UI pública
  // (app/layout.tsx) ahora usa un tema oscuro tipo cassette-deck en el
  // <body>, así que aquí forzamos explícitamente el fondo e ink claros para
  // que /admin no herede el fondo oscuro del body.
  return (
    <div className="min-h-screen bg-bone text-carbon">
      <AdminSessionProvider>{children}</AdminSessionProvider>
    </div>
  );
}
