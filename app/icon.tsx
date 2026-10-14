import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  // Use the same crop as the shared .logo-icon style, preserving the original artwork.
  const imageSize = size.width * 2.71;
  const overflow = imageSize - size.width;

  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: size.width, height: size.height,
      overflow: "hidden", background: "white" }}>
      {/* ImageResponse embeds the original local image; no remote request is needed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${logo.toString("base64")}`} alt=""
        width={imageSize} height={imageSize}
        style={{ position: "absolute", left: -overflow * 0.116, top: -overflow * 0.49 }} />
    </div>,
    size,
  );
}
