import type { APIRoute } from "astro";
import { statSync } from "fs";

export const GET: APIRoute = async () => {
  const filePath = "public/igwc-design-kit.sketch";

  let fileSize = 0;
  try {
    const stats = statSync(filePath);
    fileSize = stats.size;
  } catch (error) {
    console.error("Error getting file size:", error);
  }

  const data = {
    versionID: "1.0",
    downloadURL: "https://indianagradworkers.org/igwc-design-kit.sketch",
    downloadFileSize: fileSize,
    creationDate: new Date().toUTCString(),
    itemName: "IGWC Design Kit",
    imageURL: "https://indianagradworkers.org/igwc-thumbnail-pink.png",
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
};