/**
 * Canonical country names + normalization for company country fields.
 *
 * Used by:
 *  - server: normalize on every company write path (create, update, import, auto-create)
 *  - server: idempotent bulk cleanup routine (super-admin maintenance action)
 *  - client: <datalist> suggestions in add/edit company forms
 *
 * Contract of normalizeCountry():
 *  - null/undefined  -> null (blank stays blank)
 *  - junk artifacts  -> '' (import header leftovers like "addressCountry", "N/A")
 *  - resolvable text -> canonical English name ("usa" -> "United States")
 *  - unresolvable    -> input with whitespace/invisible chars cleaned, otherwise unchanged (never guess)
 */

export const CANONICAL_COUNTRIES: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger",
  "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico",
  "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

/** Junk values (import header artifacts, placeholders) that should become blank. */
const JUNK_VALUES = new Set([
  // NOTE: bare "na" is deliberately absent — it is ambiguous (Namibia ISO2 vs "not available"),
  // so it passes through unchanged rather than being guessed or blanked.
  "addresscountry", "factoryaddresscountry", "country", "countryname", "n/a", "none",
  "null", "undefined", "unknown", "-", "--", ".", "..", "nil", "not available", "not applicable",
]);

/** Aliases: ISO codes, abbreviations, misspellings, local/alternate names. Keys lowercase. */
const COUNTRY_ALIASES: Record<string, string> = {
  // United States
  "us": "United States", "usa": "United States", "u.s.": "United States", "u.s.a.": "United States",
  "u.s": "United States", "u.s.a": "United States", "united states of america": "United States",
  "america": "United States", "estados unidos": "United States", "the united states": "United States",
  "us of a": "United States", "united sates": "United States", "unites states": "United States",
  "united state": "United States", "usa.": "United States",
  // United Kingdom
  "uk": "United Kingdom", "u.k.": "United Kingdom", "u.k": "United Kingdom", "gb": "United Kingdom",
  "gbr": "United Kingdom", "great britain": "United Kingdom", "britain": "United Kingdom",
  "england": "United Kingdom", "scotland": "United Kingdom", "wales": "United Kingdom",
  "northern ireland": "United Kingdom", "united kingdome": "United Kingdom",
  "united kindom": "United Kingdom", "united kingdon": "United Kingdom",
  "united kingdom of great britain and northern ireland": "United Kingdom",
  // Germany
  "de": "Germany", "deu": "Germany", "ger": "Germany", "deutschland": "Germany",
  "gremany": "Germany", "germny": "Germany", "germay": "Germany", "alemania": "Germany",
  "allemagne": "Germany",
  // Turkey
  "tr": "Turkey", "tur": "Turkey", "turkiye": "Turkey", "türkiye": "Turkey", "turquia": "Turkey",
  "republic of turkey": "Turkey", "republic of türkiye": "Turkey",
  // Netherlands
  "nl": "Netherlands", "nld": "Netherlands", "holland": "Netherlands",
  "the netherlands": "Netherlands", "nederland": "Netherlands",
  // Czech Republic
  "cz": "Czech Republic", "cze": "Czech Republic", "czechia": "Czech Republic", "czech": "Czech Republic",
  // Sri Lanka
  "lk": "Sri Lanka", "lka": "Sri Lanka", "srilanka": "Sri Lanka", "sir lanka": "Sri Lanka",
  "sri-lanka": "Sri Lanka", "ceylon": "Sri Lanka",
  // Eswatini
  "sz": "Eswatini", "swz": "Eswatini", "swaziland": "Eswatini", "kingdom of eswatini": "Eswatini",
  // Bosnia and Herzegovina
  "ba": "Bosnia and Herzegovina", "bih": "Bosnia and Herzegovina", "bosnia": "Bosnia and Herzegovina",
  "bosnia & herzegovina": "Bosnia and Herzegovina", "bosnia and herzegowina": "Bosnia and Herzegovina",
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  // UAE
  "ae": "United Arab Emirates", "uae": "United Arab Emirates", "u.a.e.": "United Arab Emirates",
  "u.a.e": "United Arab Emirates", "emirates": "United Arab Emirates",
  // Koreas
  "kr": "South Korea", "kor": "South Korea", "korea": "South Korea", "republic of korea": "South Korea",
  "korea, republic of": "South Korea", "s korea": "South Korea", "s. korea": "South Korea",
  "kp": "North Korea", "dprk": "North Korea", "korea, democratic people's republic of": "North Korea",
  // Russia
  "ru": "Russia", "rus": "Russia", "russian federation": "Russia",
  // Canada
  "ca": "Canada", "can": "Canada", "canda": "Canada", "cananda": "Canada",
  // Vietnam / Laos / Syria / Iran / Tanzania / Moldova / Venezuela / Bolivia / Brunei
  "vn": "Vietnam", "viet nam": "Vietnam", "la": "Laos", "lao pdr": "Laos",
  "lao people's democratic republic": "Laos", "sy": "Syria", "syrian arab republic": "Syria",
  "ir": "Iran", "iran, islamic republic of": "Iran", "islamic republic of iran": "Iran",
  "tz": "Tanzania", "united republic of tanzania": "Tanzania", "tanzania, united republic of": "Tanzania",
  "md": "Moldova", "republic of moldova": "Moldova", "moldova, republic of": "Moldova",
  "ve": "Venezuela", "venezuela, bolivarian republic of": "Venezuela",
  "bo": "Bolivia", "bolivia, plurinational state of": "Bolivia",
  "bn": "Brunei", "brunei darussalam": "Brunei",
  // Ivory Coast / Cape Verde / Macedonia / East Timor / Congo
  "ci": "Ivory Coast", "cote d'ivoire": "Ivory Coast", "côte d'ivoire": "Ivory Coast",
  "cote divoire": "Ivory Coast", "cv": "Cape Verde", "cabo verde": "Cape Verde",
  "mk": "North Macedonia", "macedonia": "North Macedonia", "fyrom": "North Macedonia",
  "timor-leste": "East Timor", "timor leste": "East Timor",
  "cd": "Democratic Republic of the Congo", "drc": "Democratic Republic of the Congo",
  "congo, the democratic republic of the": "Democratic Republic of the Congo",
  "cg": "Republic of the Congo", "congo": "Republic of the Congo",
  // Other ISO2/ISO3 + common forms (major trading partners first)
  "fr": "France", "fra": "France", "es": "Spain", "esp": "Spain", "españa": "Spain", "espana": "Spain",
  "it": "Italy", "ita": "Italy", "italia": "Italy", "gr": "Greece", "grc": "Greece", "hellas": "Greece",
  "pl": "Poland", "pol": "Poland", "polska": "Poland", "pt": "Portugal", "prt": "Portugal",
  "be": "Belgium", "bel": "Belgium", "se": "Sweden", "swe": "Sweden", "sverige": "Sweden",
  "no": "Norway", "nor": "Norway", "norge": "Norway", "dk": "Denmark", "dnk": "Denmark", "danmark": "Denmark",
  "fi": "Finland", "fin": "Finland", "suomi": "Finland", "ie": "Ireland", "irl": "Ireland",
  "at": "Austria", "aut": "Austria", "österreich": "Austria", "osterreich": "Austria",
  "ch": "Switzerland", "che": "Switzerland", "schweiz": "Switzerland", "suisse": "Switzerland",
  "hu": "Hungary", "hun": "Hungary", "ro": "Romania", "rou": "Romania", "bg": "Bulgaria", "bgr": "Bulgaria",
  "hr": "Croatia", "hrv": "Croatia", "hrvatska": "Croatia", "si": "Slovenia", "svn": "Slovenia",
  "sk": "Slovakia", "svk": "Slovakia", "rs": "Serbia", "srb": "Serbia", "srbija": "Serbia",
  "al": "Albania", "alb": "Albania", "shqiperia": "Albania", "me": "Montenegro", "mne": "Montenegro",
  "xk": "Kosovo", "lt": "Lithuania", "ltu": "Lithuania", "lv": "Latvia", "lva": "Latvia",
  "ee": "Estonia", "est": "Estonia", "ua": "Ukraine", "ukr": "Ukraine", "by": "Belarus", "blr": "Belarus",
  "cy": "Cyprus", "cyp": "Cyprus", "mt": "Malta", "mlt": "Malta", "lu": "Luxembourg", "lux": "Luxembourg",
  "li": "Liechtenstein", "is": "Iceland", "isl": "Iceland",
  "in": "India", "ind": "India", "bharat": "India", "cn": "China", "chn": "China", "prc": "China",
  "people's republic of china": "China", "mainland china": "China",
  "jp": "Japan", "jpn": "Japan", "nippon": "Japan", "tw": "Taiwan", "twn": "Taiwan",
  "taiwan, province of china": "Taiwan", "chinese taipei": "Taiwan", "republic of china": "Taiwan",
  "hk": "Hong Kong", "hkg": "Hong Kong", "hong kong sar": "Hong Kong",
  "sg": "Singapore", "sgp": "Singapore", "my": "Malaysia", "mys": "Malaysia",
  "th": "Thailand", "tha": "Thailand", "id": "Indonesia", "idn": "Indonesia",
  "ph": "Philippines", "phl": "Philippines", "the philippines": "Philippines",
  "kh": "Cambodia", "khm": "Cambodia", "mm": "Myanmar", "mmr": "Myanmar", "burma": "Myanmar",
  "bd": "Bangladesh", "bgd": "Bangladesh", "pk": "Pakistan", "pak": "Pakistan",
  "np": "Nepal", "npl": "Nepal", "bt": "Bhutan", "mv": "Maldives", "mdv": "Maldives",
  "af": "Afghanistan", "afg": "Afghanistan", "kz": "Kazakhstan", "kaz": "Kazakhstan",
  "uz": "Uzbekistan", "uzb": "Uzbekistan", "kg": "Kyrgyzstan", "tj": "Tajikistan", "tm": "Turkmenistan",
  "mn": "Mongolia", "mng": "Mongolia", "ge": "Georgia", "geo": "Georgia",
  "am": "Armenia", "arm": "Armenia", "az": "Azerbaijan", "aze": "Azerbaijan",
  "il": "Israel", "isr": "Israel", "ps": "Palestine", "state of palestine": "Palestine",
  "palestinian territory": "Palestine", "jo": "Jordan", "jor": "Jordan", "lb": "Lebanon", "lbn": "Lebanon",
  "iq": "Iraq", "irq": "Iraq", "sa": "Saudi Arabia", "sau": "Saudi Arabia", "ksa": "Saudi Arabia",
  "kingdom of saudi arabia": "Saudi Arabia", "kw": "Kuwait", "kwt": "Kuwait",
  "qa": "Qatar", "qat": "Qatar", "bh": "Bahrain", "bhr": "Bahrain", "om": "Oman", "omn": "Oman",
  "ye": "Yemen", "yem": "Yemen",
  "eg": "Egypt", "egy": "Egypt", "ma": "Morocco", "mar": "Morocco", "maroc": "Morocco",
  "tn": "Tunisia", "tun": "Tunisia", "dz": "Algeria", "dza": "Algeria", "ly": "Libya", "lby": "Libya",
  "sd": "Sudan", "sdn": "Sudan", "ss": "South Sudan", "et": "Ethiopia", "eth": "Ethiopia",
  "ke": "Kenya", "ken": "Kenya", "ug": "Uganda", "uga": "Uganda", "rw": "Rwanda", "rwa": "Rwanda",
  "ng": "Nigeria", "nga": "Nigeria", "gh": "Ghana", "gha": "Ghana", "sn": "Senegal", "sen": "Senegal",
  "cm": "Cameroon", "cmr": "Cameroon", "zm": "Zambia", "zmb": "Zambia", "zw": "Zimbabwe", "zwe": "Zimbabwe",
  "mw": "Malawi", "mwi": "Malawi", "mz": "Mozambique", "moz": "Mozambique",
  "bw": "Botswana", "bwa": "Botswana", "nam": "Namibia",
  "za": "South Africa", "zaf": "South Africa", "rsa": "South Africa", "s africa": "South Africa",
  "s. africa": "South Africa", "mg": "Madagascar", "mdg": "Madagascar",
  "mu": "Mauritius", "mus": "Mauritius", "sc": "Seychelles",
  "au": "Australia", "aus": "Australia", "nz": "New Zealand", "nzl": "New Zealand",
  "fj": "Fiji", "pg": "Papua New Guinea",
  "mx": "Mexico", "mex": "Mexico", "méxico": "Mexico", "mejico": "Mexico",
  "gt": "Guatemala", "gtm": "Guatemala", "bz": "Belize", "sv": "El Salvador", "hn": "Honduras",
  "ni": "Nicaragua", "cr": "Costa Rica", "cri": "Costa Rica", "pa": "Panama", "pan": "Panama",
  "co": "Colombia", "col": "Colombia", "pe": "Peru", "per": "Peru", "perú": "Peru",
  "ec": "Ecuador", "ecu": "Ecuador", "br": "Brazil", "bra": "Brazil", "brasil": "Brazil",
  "ar": "Argentina", "arg": "Argentina", "cl": "Chile", "chl": "Chile", "uy": "Uruguay", "ury": "Uruguay",
  "py": "Paraguay", "pry": "Paraguay", "cu": "Cuba", "do": "Dominican Republic",
  "dominican rep": "Dominican Republic", "dom rep": "Dominican Republic",
  "jm": "Jamaica", "jam": "Jamaica", "tt": "Trinidad and Tobago", "trinidad": "Trinidad and Tobago",
  "bs": "Bahamas", "the bahamas": "Bahamas", "bb": "Barbados", "gy": "Guyana", "sr": "Suriname",
  "ht": "Haiti", "pr": "Puerto Rico",
};

/** Known cities/regions that appear in the data as "country" values. Keys lowercase. */
const CITY_REGION_TO_COUNTRY: Record<string, string> = {
  // Germany
  "hamburg": "Germany", "berlin": "Germany", "munich": "Germany", "münchen": "Germany",
  "frankfurt": "Germany", "cologne": "Germany", "köln": "Germany", "bremen": "Germany",
  "bavaria": "Germany", "stuttgart": "Germany", "düsseldorf": "Germany", "dusseldorf": "Germany",
  "hannover": "Germany", "leipzig": "Germany", "nuremberg": "Germany",
  // Greece
  "thessaloniki": "Greece", "athens": "Greece", "crete": "Greece",
  // Romania
  "tulcea county": "Romania", "tulcea": "Romania", "bucharest": "Romania", "bucuresti": "Romania",
  // Latvia
  "riga": "Latvia", "berģi": "Latvia", "bergi": "Latvia",
  // Baltics / Nordics / Central Europe
  "vilnius": "Lithuania", "tallinn": "Estonia", "stockholm": "Sweden", "gothenburg": "Sweden",
  "oslo": "Norway", "copenhagen": "Denmark", "helsinki": "Finland", "warsaw": "Poland",
  "krakow": "Poland", "prague": "Czech Republic", "budapest": "Hungary", "vienna": "Austria",
  "wien": "Austria", "zurich": "Switzerland", "geneva": "Switzerland", "basel": "Switzerland",
  "bratislava": "Slovakia", "ljubljana": "Slovenia", "zagreb": "Croatia", "belgrade": "Serbia",
  "sofia": "Bulgaria", "plovdiv": "Bulgaria",
  // UK / Ireland
  "london": "United Kingdom", "manchester": "United Kingdom", "birmingham": "United Kingdom",
  "leeds": "United Kingdom", "bristol": "United Kingdom", "glasgow": "United Kingdom",
  "edinburgh": "United Kingdom", "liverpool": "United Kingdom", "dublin": "Ireland",
  // Netherlands / Belgium / France / Iberia / Italy
  "amsterdam": "Netherlands", "rotterdam": "Netherlands", "utrecht": "Netherlands",
  "the hague": "Netherlands", "brussels": "Belgium", "antwerp": "Belgium",
  "paris": "France", "lyon": "France", "marseille": "France",
  "barcelona": "Spain", "madrid": "Spain", "valencia": "Spain", "sevilla": "Spain", "seville": "Spain",
  "lisbon": "Portugal", "porto": "Portugal", "milan": "Italy", "milano": "Italy", "rome": "Italy",
  "roma": "Italy", "naples": "Italy", "torino": "Italy", "turin": "Italy", "bologna": "Italy",
  // Turkey / Eastern Europe
  "istanbul": "Turkey", "izmir": "Turkey", "ankara": "Turkey", "antalya": "Turkey", "mersin": "Turkey",
  "kyiv": "Ukraine", "kiev": "Ukraine", "odessa": "Ukraine", "lviv": "Ukraine", "moscow": "Russia",
  // Americas
  "new york": "United States", "nyc": "United States", "los angeles": "United States",
  "chicago": "United States", "houston": "United States", "miami": "United States",
  "california": "United States", "texas": "United States", "florida": "United States",
  "new jersey": "United States", "illinois": "United States", "boston": "United States",
  "seattle": "United States", "denver": "United States", "atlanta": "United States",
  "toronto": "Canada", "vancouver": "Canada", "montreal": "Canada", "ontario": "Canada",
  "quebec": "Canada", "mexico city": "Mexico", "guadalajara": "Mexico",
  "sao paulo": "Brazil", "são paulo": "Brazil", "rio de janeiro": "Brazil",
  "buenos aires": "Argentina", "lima": "Peru", "bogota": "Colombia", "bogotá": "Colombia",
  "santiago": "Chile", "guatemala city": "Guatemala",
  // Asia / Middle East
  "mumbai": "India", "delhi": "India", "new delhi": "India", "bangalore": "India",
  "bengaluru": "India", "chennai": "India", "kochi": "India", "cochin": "India",
  "hyderabad": "India", "kolkata": "India", "pune": "India", "gujarat": "India",
  "kerala": "India", "maharashtra": "India", "ahmedabad": "India", "jaipur": "India",
  "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates", "sharjah": "United Arab Emirates",
  "tel aviv": "Israel", "jerusalem": "Israel", "colombo": "Sri Lanka", "dhaka": "Bangladesh",
  "karachi": "Pakistan", "lahore": "Pakistan", "kathmandu": "Nepal", "bangkok": "Thailand",
  "hanoi": "Vietnam", "ho chi minh": "Vietnam", "ho chi minh city": "Vietnam", "saigon": "Vietnam",
  "jakarta": "Indonesia", "kuala lumpur": "Malaysia", "manila": "Philippines",
  "tokyo": "Japan", "osaka": "Japan", "seoul": "South Korea", "beijing": "China",
  "shanghai": "China", "guangzhou": "China", "shenzhen": "China", "qingdao": "China",
  "taipei": "Taiwan",
  // Africa / Oceania
  "cairo": "Egypt", "casablanca": "Morocco", "tunis": "Tunisia", "nairobi": "Kenya",
  "lagos": "Nigeria", "accra": "Ghana", "johannesburg": "South Africa", "cape town": "South Africa",
  "durban": "South Africa", "pretoria": "South Africa", "antananarivo": "Madagascar",
  "sydney": "Australia", "melbourne": "Australia", "brisbane": "Australia", "perth": "Australia",
  "queensland": "Australia", "auckland": "New Zealand",
};

/** Strip accents/diacritics for tolerant matching. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Build one lowercase lookup map: canonical names + aliases + cities, with accent-stripped variants. */
function buildLookup(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (key: string, canonical: string) => {
    const k = key.toLowerCase().trim();
    if (k && !map.has(k)) map.set(k, canonical);
    const stripped = stripAccents(k);
    if (stripped && !map.has(stripped)) map.set(stripped, canonical);
  };
  for (const name of CANONICAL_COUNTRIES) add(name, name);
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) add(alias, canonical);
  for (const [city, canonical] of Object.entries(CITY_REGION_TO_COUNTRY)) add(city, canonical);
  return map;
}

const LOOKUP = buildLookup();

/** Remove zero-width/invisible chars, normalize whitespace. */
function cleanWhitespace(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Try resolving a single token (no comma handling) to a canonical name. */
function resolveToken(token: string): string | null {
  let t = token.trim();
  if (!t) return null;

  // Direct lookup
  const direct = LOOKUP.get(t.toLowerCase()) ?? LOOKUP.get(stripAccents(t.toLowerCase()));
  if (direct) return direct;

  // Strip leading/trailing punctuation ("BULGARIA.", ",Germany")
  const dePunct = t.replace(/^[.,;:!?'"“”‘’]+/, "").replace(/[.,;:!?'"“”‘’]+$/, "").trim();
  if (dePunct && dePunct !== t) {
    const hit = LOOKUP.get(dePunct.toLowerCase()) ?? LOOKUP.get(stripAccents(dePunct.toLowerCase()));
    if (hit) return hit;
    t = dePunct;
  }

  // Remove internal dots ("U.S.A" -> "USA")
  const noDots = t.replace(/\./g, "").trim();
  if (noDots && noDots !== t) {
    const hit = LOOKUP.get(noDots.toLowerCase()) ?? LOOKUP.get(stripAccents(noDots.toLowerCase()));
    if (hit) return hit;
  }

  // Parentheticals: "South Africa (supanutri.co.za)" / "Netherlands (the)" / "(Germany)"
  if (t.includes("(")) {
    const outside = t.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (outside) {
      const hit = resolveTokenSimple(outside);
      if (hit) return hit;
    } else {
      const inside = (t.match(/\(([^)]*)\)/) || [])[1]?.trim();
      if (inside) {
        const hit = resolveTokenSimple(inside);
        if (hit) return hit;
      }
    }
  }

  return null;
}

/** Lookup without re-entering parenthetical logic (avoids recursion loops). */
function resolveTokenSimple(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  const clean = t.replace(/^[.,;:!?'"“”‘’]+/, "").replace(/[.,;:!?'"“”‘’]+$/, "").trim();
  return (
    LOOKUP.get(clean.toLowerCase()) ??
    LOOKUP.get(stripAccents(clean.toLowerCase())) ??
    LOOKUP.get(clean.replace(/\./g, "").toLowerCase()) ??
    null
  );
}

/**
 * Normalize a raw country value to its canonical English name.
 * See contract at top of file.
 */
export function normalizeCountry(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;

  const cleaned = cleanWhitespace(String(raw));
  if (!cleaned) return "";

  // Junk artifacts -> blank
  const junkKey = cleaned.toLowerCase().replace(/[.,;:!?]+$/, "").trim();
  if (JUNK_VALUES.has(junkKey)) return "";

  // Whole-string resolution
  const whole = resolveToken(cleaned);
  if (whole) return whole;

  // "City, Country" (or "Country, City"): try last segment, then first
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const last = resolveToken(parts[parts.length - 1]);
      if (last) return last;
      const first = resolveToken(parts[0]);
      if (first) return first;
    }
  }

  // Unresolvable: pass through (whitespace-cleaned only), never guess
  return cleaned;
}

/** Like normalizeCountry, but maps blank/junk results to null (for DB writes). */
export function normalizeCountryOrNull(raw: string | null | undefined): string | null {
  const result = normalizeCountry(raw);
  return result === "" ? null : result;
}
