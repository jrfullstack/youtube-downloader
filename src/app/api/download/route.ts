import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("formatId");
  const mediaType = searchParams.get("mediaType");

  if (!url) {
    return NextResponse.json(
      { error: "URL no proporcionada" },
      { status: 400 }
    );
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");

    // Configurar las opciones de descarga
    const options: ytdl.downloadOptions = {};

    if (formatId) {
      // Si se proporciona un ID de formato específico, usarlo
      options.quality = formatId;
    } else if (mediaType === "mp3") {
      // Para MP3, obtener la mejor calidad de audio
      options.quality = "highestaudio";
      options.filter = "audioonly";
    } else {
      // Para MP4, obtener la mejor calidad de video con audio
      options.quality = "highest";
      options.filter = "audioandvideo";
    }

    // Crear el stream de descarga
    const stream = ytdl(url, options);

    // Configurar la respuesta
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${title}.${mediaType === "mp3" ? "mp3" : "mp4"}"`
    );
    headers.set(
      "Content-Type",
      mediaType === "mp3" ? "audio/mpeg" : "video/mp4"
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers,
    });
  } catch (error) {
    console.error("Error al descargar:", error);
    return NextResponse.json(
      { error: "Error al procesar la descarga" },
      { status: 500 }
    );
  }
}
