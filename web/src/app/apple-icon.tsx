import { ImageResponse } from "next/og";

// Apple touch icon (iOS "Add to Home Screen"). Next's apple-icon convention only
// supports raster formats, so we render the brand roof mark to PNG at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'>" +
  "<rect width='180' height='180' rx='40' fill='#BE5630'/>" +
  "<path d='M34 92 L90 41 L146 92' fill='none' stroke='#fff' stroke-width='15' stroke-linecap='round' stroke-linejoin='round'/>" +
  "<path d='M50 84 L50 139 L130 139 L130 84' fill='none' stroke='#fff' stroke-width='15' stroke-linecap='round' stroke-linejoin='round'/>" +
  "</svg>";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        width={180}
        height={180}
        src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
        alt="Roofdrafts"
      />
    ),
    size
  );
}
