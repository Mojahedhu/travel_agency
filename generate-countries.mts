// Usage:
//   1. Get a free API key at https://restcountries.com/sign-up
//   2. Put it in a .env file next to this script:  RESTCOUNTRIES_API_KEY=your_key_here
//   3. Run:  pnpm dlx tsx generate-countries.mts
// Writes countries.ts with: export const countries: Country[] = [ { name, coordinates, value, openStreetMap }, ... ]

import { writeFile } from "node:fs/promises";

// Load .env if present (Node 20.12+ / 21.7+). Ignored if the file doesn't exist.
try {
  process.loadEnvFile(".env.local");
} catch {}

const apiKey = process.env.RESTCOUNTRIES_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing RESTCOUNTRIES_API_KEY (add it to .env or your environment).",
  );
}

const BASE_URL = "https://api.restcountries.com/countries/v5";
const FIELDS =
  "names.common,flag.emoji,coordinates.lat,coordinates.lng,links.open_street_maps";
const LIMIT = 100; // max page size on the free plan

// The list endpoint is paginated, so keep requesting pages until `meta.more` is false.
const all: any[] = [];
for (let offset = 0; ; offset += LIMIT) {
  const res = await fetch(
    `${BASE_URL}?response_fields=${FIELDS}&limit=${LIMIT}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) {
    throw new Error(
      `REST Countries request failed: HTTP ${res.status} ${await res.text()}`,
    );
  }
  const { data } = await res.json();
  all.push(...data.objects);
  if (!data.meta.more) break;
}

// Results already come back sorted by names.common.
const countries = all.map((country: any) => ({
  name: (country.flag?.emoji ?? "") + country.names.common,
  coordinates: [country.coordinates.lat, country.coordinates.lng],
  value: country.names.common,
  openStreetMap: country.links?.open_street_maps,
}));

const file = `export interface Country {
  name: string; // flag emoji + common name
  coordinates: [number, number]; // [lat, lng]
  value: string; // common name
  openStreetMap?: string;
}

export const countries: Country[] = ${JSON.stringify(countries, null, 2)};
`;

await writeFile(new URL("./countries.ts", import.meta.url), file);

console.log(`Wrote ${countries.length} countries to countries.ts`);
