// lib/youtube-actions.ts (Server Actions)
"use server";

import ytdl from "ytdl-core";
import ytsr from "ytsr";
import ytpl from "ytpl";

export interface FormatOption {
  formatId: string;
  type: "audio" | "video";
  quality: number;
  label: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  formats: FormatOption[];
}

// Función para formatear la duración del video (de segundos a MM:SS o HH:MM:SS)
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Obtener información de un video individual
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  try {
    if (url.includes("playlist") || url.includes("list=")) {
      throw new Error(
        "Esta es una playlist. Utilice la función específica para playlists."
      );
    }

    if (url.includes("channel") || url.includes("/c/") || url.includes("@")) {
      throw new Error(
        "Esta es un canal. Utilice la función específica para canales."
      );
    }

    const info = await ytdl.getInfo(url);

    // Procesar formatos de video
    const videoFormats = info.formats
      .filter((format) => format.hasVideo && format.hasAudio)
      .map((format) => {
        const height = format.height || 0;
        const qualityLabel = format.qualityLabel || `${height}p`;

        return {
          formatId: format.itag.toString(),
          type: "video" as const,
          quality: height,
          label: `${qualityLabel} (${format.container})`,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Procesar formatos de audio
    const audioFormats = info.formats
      .filter((format) => !format.hasVideo && format.hasAudio)
      .map((format) => {
        const bitrate = format.audioBitrate || 0;

        return {
          formatId: format.itag.toString(),
          type: "audio" as const,
          quality: bitrate,
          label: `${bitrate}kbps (${format.container})`,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Duración en segundos
    const durationInSeconds = parseInt(info.videoDetails.lengthSeconds);

    return {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          .url,
      duration: formatDuration(durationInSeconds),
      formats: [...videoFormats, ...audioFormats],
    };
  } catch (error) {
    console.error("Error al obtener información del video:", error);
    throw new Error("No se pudo obtener la información del video");
  }
}

// Obtener información de una playlist
export async function getPlaylistInfo(url: string) {
  try {
    const playlist = await ytpl(url);

    return {
      id: playlist.id,
      title: playlist.title,
      videos: playlist.items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnails[item.thumbnails.length - 1].url,
        duration: item.duration || "0:00",
        url: item.url,
      })),
    };
  } catch (error) {
    console.error("Error al obtener información de la playlist:", error);
    throw new Error("No se pudo obtener la información de la playlist");
  }
}

// Obtener videos de un canal (limitados para evitar problemas de memoria)
export async function getChannelVideos(url: string, limit = 50) {
  try {
    const searchResults = await ytsr(url, { limit });

    const videos = searchResults.items
      .filter((item) => item.type === "video")
      .map((item) => {
        const video = item as ytsr.Video;
        return {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnails[video.thumbnails.length - 1].url,
          duration: video.duration || "0:00",
          url: video.url,
        };
      });

    return {
      title: `Resultados para: ${url}`,
      videos,
    };
  } catch (error) {
    console.error("Error al obtener videos del canal:", error);
    throw new Error("No se pudo obtener los videos del canal");
  }
}
