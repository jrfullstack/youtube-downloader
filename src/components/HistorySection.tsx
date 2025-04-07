// components/HistorySection.tsx (Client Component)
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  downloadedAt: string;
  mediaType: "mp3" | "mp4";
}

export default function HistorySection() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Cargar historial al montar el componente
    const loadHistory = () => {
      const savedHistory = JSON.parse(
        localStorage.getItem("downloadHistory") || "[]"
      );
      setHistory(savedHistory);
    };

    loadHistory();

    // Escuchar cambios en localStorage
    window.addEventListener("storage", loadHistory);
    return () => {
      window.removeEventListener("storage", loadHistory);
    };
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem("downloadHistory");
    setHistory([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (history.length === 0) {
    return (
      <p className="text-center text-gray-500">No hay descargas recientes</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Descargas recientes</h3>
        <Button variant="outline" size="sm" onClick={handleClearHistory}>
          Limpiar historial
        </Button>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={`${item.id}-${item.mediaType}`}
            className="flex items-center gap-3 p-3 border rounded-md">
            <Image
              src={item.thumbnail}
              alt={item.title}
              width={96}
              height={54}
              className="rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-sm text-gray-500">
                {item.mediaType.toUpperCase()} • {formatDate(item.downloadedAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/api/download?url=${encodeURIComponent(
                  item.url
                )}&mediaType=${item.mediaType}`;
              }}>
              Volver a descargar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
