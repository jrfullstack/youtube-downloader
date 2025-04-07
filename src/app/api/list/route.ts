import { NextResponse } from "next/server";
import ytpl from "ytpl";
import ytsr from "ytsr";

export const dynamic = "force-dynamic"; // importante para SSR

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

  try {
    let videos: {
      title: string;
      url: string;
      duration: number;
      thumbnail: string;
    }[] = [];

    if (ytpl.validateID(url)) {
      const playlist = await ytpl(url, { limit: 100 }); // o más si quieres
      videos = playlist.items.map((item) => ({
        title: item.title || "Sin título",
        url: item.shortUrl,
        duration: item.durationSec ? parseInt(item.durationSec.toString()) : 0,
        thumbnail: item.bestThumbnail.url || "",
      }));
    } else {
      const channel = await ytsr(url, { pages: 5 });
      const filtered = channel.items.filter(
        (i: { type: string }) => i.type === "video"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videos = filtered.map((item: any) => ({
        title: item.title,
        url: item.url,
        duration: item.duration ? parseDuration(item.duration) : 0,
        thumbnail: item.thumbnails[0].url,
      }));
    }

    return NextResponse.json({ items: videos });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

function parseDuration(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}
