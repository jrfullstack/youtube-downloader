"use client";

import React, { useState } from "react";
import Image from "next/image";

type VideoItem = {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
};

export default function VideoBatchDownloader() {
  const [inputUrl, setInputUrl] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchVideos = async () => {
    if (!inputUrl) return;
    setLoading(true);
    setSelectedUrls(new Set());
    const res = await fetch(`/api/list?url=${encodeURIComponent(inputUrl)}`);
    const data = await res.json();
    if (data.items) setVideos(data.items);
    setLoading(false);
  };

  const toggleSelect = (url: string) => {
    const updated = new Set(selectedUrls);
    if (updated.has(url)) {
      updated.delete(url);
    } else {
      updated.add(url);
    }
    setSelectedUrls(updated);
  };

  const selectAll = () => {
    if (selectedUrls.size === videos.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(videos.map((v) => v.url)));
    }
  };

  const downloadSelected = async () => {
    if (!selectedUrls.size) return;

    setDownloading(true);
    for (const url of selectedUrls) {
      const video = videos.find((v) => v.url === url);
      if (!video) continue;

      const a = document.createElement("a");
      a.href = `/api/download?url=${encodeURIComponent(url)}&type=video`;
      a.download = `${sanitizeFilename(video.title)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      await new Promise((res) => setTimeout(res, 1500)); // espera entre descargas
    }
    setDownloading(false);
  };

  const sanitizeFilename = (title: string) =>
    title.replace(/[\/\\?%*:|"<>]/g, "").slice(0, 100);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Descargar videos de YouTube</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Pega aquí el link del playlist o canal"
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? "Cargando..." : "Cargar"}
        </button>
      </div>

      {videos.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedUrls.size} de {videos.length} seleccionados
            </span>
            <button
              onClick={selectAll}
              className="text-blue-500 underline text-sm">
              {selectedUrls.size === videos.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div
                key={video.url}
                className="flex gap-4 items-center border p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedUrls.has(video.url)}
                  onChange={() => toggleSelect(video.url)}
                />
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={120}
                  height={90}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{video.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDuration(video.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={downloadSelected}
            disabled={downloading || selectedUrls.size === 0}
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded">
            {downloading ? "Descargando..." : "Descargar seleccionados"}
          </button>
        </>
      )}
    </div>
  );
}

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}
