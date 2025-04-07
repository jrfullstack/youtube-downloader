// test-ytdl.ts
import ytdl from "ytdl-core";

(async () => {
  const url = "https://www.youtube.com/watch?v=nTyhyL_4RPw";
  if (!ytdl.validateURL(url)) {
    console.log("❌ Invalid URL");
    return;
  }

  try {
    const info = await ytdl.getInfo(url);
    console.log("✅ Title:", info.videoDetails.title);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
