// Parsed sample roofs (real AppliCad exports) shared by the marketing cards
// and the sample report. Parsed once at module scope — the parser is fast and
// the result is immutable.
import { parseAppliCad } from "@/lib/applicad";
import { SAMPLE_ROOF_XML } from "@/data/sample-roof";
import { COMMERCIAL_ROOF_XML } from "@/data/sample-roof-commercial";

/** 13 Rivers Run Way, Oak Ridge TN — steep-slope residential (hips/valleys). */
export const RESIDENTIAL_ROOF = parseAppliCad(SAMPLE_ROOF_XML);

/** 3110 Chayote Rd NE, Rio Rancho NM — flat/low-slope with box gutters. */
export const COMMERCIAL_ROOF = parseAppliCad(COMMERCIAL_ROOF_XML);
