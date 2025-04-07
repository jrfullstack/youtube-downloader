import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL no proporcionada" },
      { status: 400 }
    );
  }

  try {
    const info = await ytdl.getInfo(url);

    // Procesar formatos de video
    const videoFormats = info.formats
      .filter((format) => format.hasVideo && format.hasAudio)
      .map((format) => {
        const height = format.height || 0;
        const qualityLabel = format.qualityLabel || `${height}p`;

        return {
          formatId: format.itag.toString(),
          type: "video",
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
          type: "audio",
          quality: bitrate,
          label: `${bitrate}kbps (${format.container})`,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Duración en segundos
    const durationInSeconds = parseInt(info.videoDetails.lengthSeconds);

    // Formatear la duración del video (de segundos a MM:SS o HH:MM:SS)
    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`;
      }
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    return NextResponse.json({
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          .url,
      duration: formatDuration(durationInSeconds),
      formats: [...videoFormats, ...audioFormats],
    });
  } catch (error) {
    console.error("Error al obtener información del video:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la información del video" },
      { status: 500 }
    );
  }
}
