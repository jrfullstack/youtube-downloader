// app/page.tsx (Server Component)
import { Suspense } from "react";
import DownloaderForm from "@/components/DownloaderForm";
import HistorySection from "@/components/HistorySection";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Descargador de YouTube
      </h1>

      <div className="max-w-3xl mx-auto">
        <Suspense fallback={<div className="text-center">Cargando...</div>}>
          <DownloaderForm />
        </Suspense>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">
            Historial de Descargas
          </h2>
          <HistorySection />
        </div>
      </div>
    </main>
  );
}
