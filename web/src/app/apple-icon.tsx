import { ImageResponse } from "next/og";

// Apple touch icon (iOS "Add to Home Screen"). Next's apple-icon convention only
// supports raster formats, so we render the brand roof mark to PNG at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same "carpenter's square" mark as RoofMark / icon.svg (32-grid ×5.625).
const MARK =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'>" +
  "<rect width='180' height='180' rx='52.3' fill='#BE5630'/>" +
  "<path d='M90 33.75 L25.87 103.5 L35.38 103.5 L84.04 54.84' fill='none' stroke='#fff' stroke-width='3.95' stroke-linejoin='bevel'/>" +
  "<path d='M90 33.75 L159.75 103.5 L132.69 103.5 L84.04 54.84 Z' fill='#fff'/>" +
  "<path d='M87.92 58.72 L91.69 54.96 M92.48 63.28 L96.24 59.51 M97.03 67.84 L103.78 61.03 M101.53 72.34 L105.36 68.57 M106.09 76.89 L109.86 73.12 M110.64 81.45 L114.41 77.68 M115.2 86.01 L121.95 79.2 M119.7 90.51 L123.53 86.74 M124.26 95.06 L128.03 91.29 M128.81 99.62 L132.58 95.85' fill='none' stroke='#BE5630' stroke-width='2.36' stroke-linecap='round'/>" +
  "<circle cx='84.4' cy='81' r='9' fill='#E8B23A'/>" +
  "<path d='M32.62 116.44 v21.38 M147.38 116.44 v21.38 M37.69 127.13 H142.31' fill='none' stroke='#fff' stroke-width='5.34' stroke-linecap='round'/>" +
  "<path d='M35.44 127.13 l21.38 -5.06 v10.12 Z M144.56 127.13 l-21.38 -5.06 v10.12 Z' fill='#fff'/>" +
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
