import { NextRequest } from "next/server";
import ytdl from "ytdl-core";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url || !ytdl.validateURL(url)) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const info = await ytdl.getInfo(url);
    const { title, lengthSeconds, thumbnails } = info.videoDetails;

    return Response.json({
      title,
      duration: Number(lengthSeconds),
      thumbnail: thumbnails.at(-1)?.url,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch video info",
          message: err.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.error("❌ Unknown error in /api/info:", err);
      return new Response(
        JSON.stringify({
          error: "An unknown error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
