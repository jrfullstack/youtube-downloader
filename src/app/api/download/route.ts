import { NextRequest } from "next/server";
import ytdl from "ytdl-core";

function sanitizeFileName(name: string) {
  return name.replace(/[\/\\?%*:|"<>]/g, "").trim(); // evita caracteres ilegales
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const type = req.nextUrl.searchParams.get("type") || "both";

  if (!url || !ytdl.validateURL(url)) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const info = await ytdl.getInfo(url);
  const title = sanitizeFileName(info.videoDetails.title);

  let format;
  let extension = "mp4";

  switch (type) {
    case "audio":
      format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
      extension = "mp3";
      break;
    case "video":
      format = ytdl.chooseFormat(info.formats, { quality: "highestvideo" });
      extension = "mp4";
      break;
    case "both":
    default:
      format = ytdl.chooseFormat(info.formats, { quality: "highest" });
      extension = "mp4";
      break;
  }

  const fileName = `${title}.${extension}`;

  const headers = new Headers();
  headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
  headers.set("Content-Type", format.mimeType || "application/octet-stream");

  const nodeStream = ytdl.downloadFromInfo(info, { format });
  const readableStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(readableStream, {
    headers,
  });
}
