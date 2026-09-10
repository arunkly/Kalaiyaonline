import raw from "@/data/election.json";

export type Candidate = {
  id: string;
  name: string;
  party: string;
  partySlug: string;
  votes: number;
  winner: boolean;
  meta: string;
  photo?: string;
  bio?: string;
};

export type Constituency = {
  id: string;
  nameNp: string;
  nameEn: string;
  districtNp: string;
  districtEn: string;
  seat: number;
  voters: number;
  femaleVoters: number;
  maleVoters: number;
  otherVoters: number;
  age1825: number;
  age2640: number;
  age4160: number;
  age61: number;
  voters2079: number;
  votesCast2079: number;
  status: string;
  votesCounted: number;
  candidates: Candidate[];
  winnerName: string;
  winnerParty: string;
  winnerPartySlug: string;
  winnerVotes: number;
};

export type Party = {
  id: number | string;
  name: string;
  nick: string;
  slug: string;
  color: string;
  leading: number;
  won: number;
  seats: number;
  proportionalVotes: number;
  proportionalSeats: number;
  won2079: number;
};

export type MadheshShareRow = {
  party: string;
  slug: string;
  seats: number;
};

export type LocalBody = {
  id: string;
  name: string;
  districtEn: string;
  districtNp: string;
  type: string;
  post: string;
  ward: string;
  status: string;
  candidates: Candidate[];
  winnerName: string;
  winnerParty: string;
  winnerVotes: number;
};

export type SiteCopy = {
  siteName: string;
  electionType: string;
  kicker: string;
  headline: string;
  intro: string;
  metaDescription: string;
  footer: string;
};

export const DEFAULT_SITE: SiteCopy = {
  siteName: "मधेश चुनाव",
  electionType: "प्रतिनिधिसभा २०८२",
  kicker: "निर्वाचन २०८२ · मधेश प्रदेश",
  headline: "मधेशका ३२ क्षेत्रको नतिजा।",
  intro: "प्रतिनिधिसभा प्रत्यक्ष तर्फका आठ जिल्ला — सप्तरीदेखि पर्सासम्म।",
  metaDescription:
    "प्रतिनिधिसभा निर्वाचन २०८२ अन्तर्गत मधेश प्रदेशका ३२ क्षेत्रको नतिजा।",
  footer: "मधेश प्रदेश · प्रतिनिधिसभा निर्वाचन २०८२",
};

export const RESULT_KINDS = [
  { id: "hor", label: "प्रतिनिधिसभा क्षेत्रगत" },
  { id: "madhesh", label: "मधेशमा दलअनुसार सिट" },
  { id: "national", label: "राष्ट्रिय प्रत्यक्ष सिट" },
  { id: "local", label: "स्थानीय तह" },
] as const;

export type DisplayRule = {
  id: string;
  kind: string;
  start: string;
  end: string;
};

export type DisplayPlan = {
  mode: "all" | "schedule";
  rules: DisplayRule[];
};

export const DEFAULT_PLAN: DisplayPlan = { mode: "all", rules: [] };

export type ElectionData = {
  source: string;
  sourceLabel: string;
  election: string;
  electionEn: string;
  updated: string;
  national: {
    directSeats: number;
    totalVoters: number;
    maleVoters: number;
    femaleVoters: number;
    otherVoters: number;
    candidates: number;
    parties: number;
    hotSeats: number;
    proportionalVotes: number;
    declaredSeats: number;
    leadingSeats: number;
  };
  madhesh: {
    nameNp: string;
    nameEn: string;
    voters: number;
    pollingStations: number;
    pollingCenters: number;
    seats: number;
    districts: number;
  };
  parties: Party[];
  constituencies: Constituency[];
  madheshShare?: MadheshShareRow[];
  site?: SiteCopy;
  localBodies?: LocalBody[];
  live?: {
    enabled: boolean;
    at: string;
    ok: boolean;
  };
  display?: DisplayPlan;
  frontPage?: "hor" | "local";
};

export const LOCAL_BODY_TYPES = [
  { id: "gaunpalika", label: "गाउँपालिका" },
  { id: "nagarpalika", label: "नगरपालिका" },
  { id: "upamahanagar", label: "उपमहानगरपालिका" },
  { id: "mahanagar", label: "महानगरपालिका" },
] as const;

export const LOCAL_POSTS = [
  { id: "chief", label: "प्रमुख / अध्यक्ष" },
  { id: "deputy", label: "उपप्रमुख / उपाध्यक्ष" },
  { id: "ward-chair", label: "वडा अध्यक्ष" },
] as const;

export function localBodiesOf(data: ElectionData = election): LocalBody[] {
  return data.localBodies ?? [];
}

export function syncLocalBody(body: LocalBody): LocalBody {
  const candidates = [...body.candidates].sort((a, b) => b.votes - a.votes);
  const marked = candidates.find((c) => c.winner) ?? candidates[0];
  const next = candidates.map((c) => ({
    ...c,
    winner: marked ? c.id === marked.id : false,
  }));
  const winner = next.find((c) => c.winner);
  return {
    ...body,
    candidates: next,
    winnerName: winner?.name ?? "",
    winnerParty: winner?.party ?? "",
    winnerVotes: winner?.votes ?? 0,
  };
}

export function frontPageOf(data: ElectionData = election): "hor" | "local" {
  return data.frontPage === "local" ? "local" : "hor";
}

export function displayPlan(data: ElectionData = election): DisplayPlan {
  return {
    mode: data.display?.mode === "schedule" ? "schedule" : "all",
    rules: data.display?.rules ?? [],
  };
}

export function activeKinds(plan: DisplayPlan, now = new Date()): Set<string> {
  const all = new Set(RESULT_KINDS.map((k) => k.id));
  if (plan.mode !== "schedule" || plan.rules.length === 0) return all;
  const t = now.getTime();
  const hit = new Set<string>();
  for (const rule of plan.rules) {
    const start = rule.start ? new Date(rule.start).getTime() : Number.NEGATIVE_INFINITY;
    const end = rule.end ? new Date(rule.end).getTime() : Number.POSITIVE_INFINITY;
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (t >= start && t < end) hit.add(rule.kind);
  }
  return hit.size ? hit : new Set();
}

export const election = raw as ElectionData;

export function siteCopy(data: ElectionData = election): SiteCopy {
  return { ...DEFAULT_SITE, ...data.site };
}

export const DISTRICTS = [
  { np: "सप्तरी", en: "Saptari" },
  { np: "सिराहा", en: "Siraha" },
  { np: "धनुषा", en: "Dhanusha" },
  { np: "महोत्तरी", en: "Mahottari" },
  { np: "सर्लाही", en: "Sarlahi" },
  { np: "रौतहट", en: "Rautahat" },
  { np: "बारा", en: "Bara" },
  { np: "पर्सा", en: "Parsa" },
] as const;

const PARTY_TONE: Record<string, string> = {
  "rastriya-swatantra-party-rsp": "#0b8a3e",
  "nepali-congress": "#1f6b38",
  "cpn-uml": "#c44b2b",
  "nepal-communist-party": "#a33b28",
  "janata-samajwadi-party-nepal": "#3d6b52",
  "janamat-party": "#f15a22",
  "rastriya-prajatantra-party": "#6d8674",
  "loktantrik-samajwadi-party-nepal": "#2f7a4a",
  independent: "#6d8674",
  swatantra: "#6d8674",
};

export function partyTone(slug: string, fallback?: string): string {
  if (PARTY_TONE[slug]) return PARTY_TONE[slug];
  if (fallback && /^#/.test(fallback) && fallback !== "#2cd9ff") return fallback;
  return "#6d8674";
}

export function partyShort(name: string, slug: string): string {
  const map: Record<string, string> = {
    "rastriya-swatantra-party-rsp": "रास्वपा",
    "nepali-congress": "कांग्रेस",
    "cpn-uml": "एमाले",
    "nepal-communist-party": "नेकपा",
    "janata-samajwadi-party-nepal": "जसपा",
    "janamat-party": "जनमत",
    "rastriya-prajatantra-party": "राप्रपा",
  };
  return map[slug] ?? name.replace("राष्ट्रिय स्वतन्त्र पार्टी", "रास्वपा");
}

export function madheshSeatShare(data: ElectionData = election) {
  if (data.madheshShare?.length) {
    return [...data.madheshShare].sort((a, b) => b.seats - a.seats);
  }
  const counts = new Map<string, { party: string; slug: string; seats: number }>();
  for (const c of data.constituencies) {
    const key = c.winnerPartySlug || c.winnerParty || "unknown";
    const cur = counts.get(key) ?? {
      party: c.winnerParty,
      slug: c.winnerPartySlug,
      seats: 0,
    };
    cur.seats += 1;
    counts.set(key, cur);
  }
  return [...counts.values()].sort((a, b) => b.seats - a.seats);
}

export function getConstituency(id: string, data: ElectionData = election): Constituency | undefined {
  return data.constituencies.find((c) => c.id === id);
}

export function seatLabel(c: { districtNp: string; districtEn: string; seat: number }, lang: "np" | "en") {
  const n = lang === "np"
    ? String(c.seat).replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)] ?? d)
    : String(c.seat);
  return lang === "np" ? `${c.districtNp} - ${n}` : `${c.districtEn} ${n}`;
}

export function districtSlug(en: string): string {
  const map: Record<string, string> = {
    Saptari: "saptari",
    Siraha: "siraha",
    Dhanusha: "dhanusa",
    Mahottari: "mahottari",
    Sarlahi: "sarlahi",
    Rautahat: "rautahat",
    Bara: "bara",
    Parsa: "parsa",
  };
  return map[en] ?? en.toLowerCase();
}

export function syncSeat(seat: Constituency): Constituency {
  const candidates = [...seat.candidates].sort((a, b) => b.votes - a.votes);
  const marked = candidates.find((c) => c.winner) ?? candidates[0];
  const next = candidates.map((c) => ({
    ...c,
    winner: marked ? c.id === marked.id && c.name === marked.name : false,
  }));
  const winner = next.find((c) => c.winner);
  return {
    ...seat,
    candidates: next,
    votesCounted: next.reduce((n, c) => n + (Number(c.votes) || 0), 0),
    winnerName: winner?.name ?? "",
    winnerParty: winner?.party ?? "",
    winnerPartySlug: winner?.partySlug ?? "",
    winnerVotes: winner?.votes ?? 0,
  };
}

export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const western = new Intl.NumberFormat("en-NP").format(n);
  return western.replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)] ?? d);
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}



