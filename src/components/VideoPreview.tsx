// components/VideoPreview.tsx (Client Component)
"use client";

import Image from "next/image";

interface VideoPreviewProps {
  title: string;
  thumbnail: string;
  duration: string;
}

export default function VideoPreview({
  title,
  thumbnail,
  duration,
}: VideoPreviewProps) {
  // Función para capitalizar el título (primera letra de cada palabra en mayúscula)
  const capitalizeTitle = (text: string): string => {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative">
        <Image
          src={thumbnail}
          alt={title}
          width={192}
          height={108}
          className="rounded-md"
        />
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
          {duration}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-lg">{capitalizeTitle(title)}</h3>
      </div>
    </div>
  );
}
