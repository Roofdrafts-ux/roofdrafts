import { ImageResponse } from "next/og";

// Apple touch icon (iOS "Add to Home Screen"). Next's apple-icon convention only
// supports raster formats, so we render the brand roof mark to PNG at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same "carpenter's square roof" mark as RoofMark / icon.svg (32-grid ×5.625).
const MARK =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'>" +
  "<rect width='180' height='180' rx='40' fill='#BE5630'/>" +
  "<path d='M27 104.6 L90 41.6 L153 104.6 L129.4 104.6 L90 65.3 L50.6 104.6 Z' fill='#fff'/>" +
  "<path d='M99 65.8 l5.9 -5.9 M109.1 75.9 l5.9 -5.9 M119.3 86.1 l5.9 -5.9 M129.4 96.2 l5.9 -5.9' fill='none' stroke='#BE5630' stroke-width='4.2' stroke-linecap='round'/>" +
  "<circle cx='90' cy='87.8' r='10.7' fill='#E8B23A'/>" +
  "<path d='M38.3 120.4 v18 M141.8 120.4 v18 M42.8 129.4 H137.3' fill='none' stroke='#fff' stroke-width='6.8' stroke-linecap='round'/>" +
  "<path d='M41.1 129.4 l14.6 -6.8 v13.6 Z M138.9 129.4 l-14.6 -6.8 v13.6 Z' fill='#fff'/>" +
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
