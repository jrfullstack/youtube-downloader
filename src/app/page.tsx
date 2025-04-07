"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
// import VideoBatchDownloader from "./components/VideoBatchDownloader";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"audio" | "video" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [history, setHistory] = useState<VideoInfo[]>([]);

  const fetchInfo = async (link: string) => {
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      if (data?.title) {
        setInfo(data);
      } else {
        setInfo(null);
      }
    } catch {
      setInfo(null);
    }
  };

  const handleDownload = () => {
    if (!url || !info) return;

    setLoading(true);
    const a = document.createElement("a");
    a.href = `/api/download?url=${encodeURIComponent(url)}&type=${type}`;
    a.download = `${info.title}.${type === "audio" ? "mp3" : "mp4"}`;
    a.click();
    setLoading(false);

    // Guardar en historial
    const newEntry: VideoInfo = {
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
    };
    const updated = [
      newEntry,
      ...history.filter((v) => v.title !== newEntry.title),
    ].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (url && url.includes("youtube")) {
        fetchInfo(url);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [url]);

  useEffect(() => {
    const saved = localStorage.getItem("history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-black">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🎬 YouTube Downloader
        </h1>

        <input
          type="text"
          placeholder="Paste YouTube URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border px-4 py-2 rounded mb-4"
        />

        <div className="flex justify-between mb-4">
          {(["audio", "video", "both"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setType(opt)}
              className={`px-4 py-2 rounded border ${
                type === opt ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}>
              {opt === "audio"
                ? "🎧 Audio"
                : opt === "video"
                ? "🎥 Video"
                : "📽️ Audio + Video"}
            </button>
          ))}
        </div>

        {info && (
          <div className="mb-4 text-sm border rounded p-2 flex gap-4">
            <Image
              src={info.thumbnail}
              alt="thumb"
              className="w-16 h-12 object-cover rounded"
            />
            <div>
              <p className="font-bold">{info.title}</p>
              <p>
                ⏱️ {Math.floor(info.duration / 60)}m {info.duration % 60}s
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={loading || !info}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50">
          {loading ? "Processing..." : "⬇️ Download"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="bg-white mt-8 p-4 rounded shadow w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">📜 History</h2>
          <ul className="text-sm space-y-2">
            {history.map((item, i) => (
              <li key={i} className="flex gap-2 items-center">
                <Image
                  alt="thumb"
                  src={item.thumbnail}
                  className="w-10 h-6 object-cover rounded"
                />
                <span className="truncate">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* <VideoBatchDownloader /> */}
    </main>
  );
}
