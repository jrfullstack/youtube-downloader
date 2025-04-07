// components/DownloaderForm.tsx (Client Component)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VideoPreview from "./VideoPreview";

// Interfaces
interface FormatOption {
  formatId: string;
  type: "audio" | "video";
  quality: number;
  label: string;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  formats: FormatOption[];
}

interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  downloadedAt: string;
  mediaType: "mp3" | "mp4";
}

export default function DownloaderForm() {
  const [url, setUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"mp3" | "mp4">("mp4");
  const [loading, setLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Obtener información del video desde la API
  const handleGetInfo = async () => {
    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      setError("Por favor, ingresa una URL válida de YouTube");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/video-info?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener información del video");
      }

      const info = await response.json();
      setVideoInfo(info);

      // Seleccionar la mejor calidad por defecto
      if (info.formats.length > 0) {
        if (mediaType === "mp4") {
          const bestVideo = info.formats
            .filter((f: FormatOption) => f.type === "video")
            .sort(
              (a: FormatOption, b: FormatOption) => b.quality - a.quality
            )[0];
          setSelectedQuality(bestVideo?.formatId || "");
        } else {
          const bestAudio = info.formats
            .filter((f: FormatOption) => f.type === "audio")
            .sort(
              (a: FormatOption, b: FormatOption) => b.quality - a.quality
            )[0];
          setSelectedQuality(bestAudio?.formatId || "");
        }
      }
    } catch (err) {
      setError("Error al obtener información del video");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la calidad seleccionada cuando cambia el tipo de medio
  const updateSelectedQuality = () => {
    if (videoInfo) {
      if (mediaType === "mp4") {
        const bestVideo = videoInfo.formats
          .filter((f) => f.type === "video")
          .sort((a, b) => b.quality - a.quality)[0];
        setSelectedQuality(bestVideo?.formatId || "");
      } else {
        const bestAudio = videoInfo.formats
          .filter((f) => f.type === "audio")
          .sort((a, b) => b.quality - a.quality)[0];
        setSelectedQuality(bestAudio?.formatId || "");
      }
    }
  };

  // Manejar cambio de tipo de medio
  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as "mp3" | "mp4");
    updateSelectedQuality();
  };

  // Descargar el video o audio
  const handleDownload = () => {
    if (!videoInfo || !selectedQuality) return;

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(
        url
      )}&formatId=${selectedQuality}&mediaType=${mediaType}`;

      // Crear un enlace invisible para descargar
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${videoInfo.title}.${mediaType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Guardar en el historial
      saveToHistory({
        id: videoInfo.id,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        url: url,
        downloadedAt: new Date().toISOString(),
        mediaType: mediaType,
      });
    } catch (err) {
      setError("Error al descargar el archivo");
      console.error(err);
    }
  };

  // Guardar en el historial local
  const saveToHistory = (item: HistoryItem) => {
    const history = JSON.parse(localStorage.getItem("downloadHistory") || "[]");
    // Evitar duplicados basados en ID y tipo de medio
    const updatedHistory = [
      item,
      ...history.filter(
        (h: HistoryItem) =>
          !(h.id === item.id && h.mediaType === item.mediaType)
      ),
    ].slice(0, 50); // Limitar a 50 elementos

    localStorage.setItem("downloadHistory", JSON.stringify(updatedHistory));
    // Disparar evento para actualizar el componente de historial
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="URL de YouTube (video, playlist o canal)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleGetInfo} disabled={loading}>
            {loading ? "Buscando..." : "Obtener Info"}
          </Button>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <RadioGroup
          value={mediaType}
          onValueChange={handleMediaTypeChange}
          className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mp4" id="mp4" />
            <Label htmlFor="mp4">MP4 (Video)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mp3" id="mp3" />
            <Label htmlFor="mp3">MP3 (Audio)</Label>
          </div>
        </RadioGroup>
      </div>

      {videoInfo && (
        <div className="space-y-6">
          <VideoPreview
            title={videoInfo.title}
            thumbnail={videoInfo.thumbnail}
            duration={videoInfo.duration}
          />

          <div className="space-y-2">
            <Label htmlFor="quality">Calidad</Label>
            <Select value={selectedQuality} onValueChange={setSelectedQuality}>
              <SelectTrigger id="quality">
                <SelectValue placeholder="Selecciona calidad" />
              </SelectTrigger>
              <SelectContent>
                {videoInfo.formats
                  .filter((format) =>
                    mediaType === "mp4"
                      ? format.type === "video"
                      : format.type === "audio"
                  )
                  .map((format) => (
                    <SelectItem key={format.formatId} value={format.formatId}>
                      {format.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownload}
            className="w-full"
            disabled={!selectedQuality}>
            Descargar {mediaType === "mp4" ? "Video" : "Audio"}
          </Button>
        </div>
      )}
    </div>
  );
}
