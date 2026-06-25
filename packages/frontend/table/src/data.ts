import { GritColumnDef } from "@grit42/table";

/**
 * Playground mock data for @grit42/table.
 *
 * The generator is deterministic (seeded PRNG) so reloads produce the same
 * rows — handy when eyeballing sorting/filtering. It covers every column type
 * the table understands and sprinkles in nulls so the "empty"/"not empty"
 * filter operators have something to bite on.
 */

export interface SampleRow {
  id: number;
  compound_name: string;
  project: string;
  status: string;
  description: string | null;
  concentration_um: number | null;
  molecular_weight: number;
  purity_pct: number | null;
  replicates: number;
  is_active: boolean;
  homepage: string | null;
  record: string;
  registered_on: string;
  updated_at: string;
}

export const sampleDataProperties: GritColumnDef<SampleRow>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
    type: "integer",
    size: 70,
    description: "Internal registry identifier",
  },
  {
    id: "compound_name",
    accessorKey: "compound_name",
    header: "Compound",
    type: "string",
    size: 160,
    description: "Human readable compound name",
  },
  {
    id: "project",
    accessorKey: "project",
    header: "Project",
    type: "string",
    size: 130,
    description: "Therapeutic area the compound belongs to",
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    type: "string",
    size: 120,
    description: "Current lifecycle status",
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "text",
    size: 280,
    description: "Free text notes (nullable)",
  },
  {
    id: "concentration_um",
    accessorKey: "concentration_um",
    header: "Conc. (µM)",
    type: "float",
    size: 110,
    description: "Stock concentration in micromolar (nullable)",
  },
  {
    id: "molecular_weight",
    accessorKey: "molecular_weight",
    header: "MW (g/mol)",
    type: "decimal",
    size: 110,
    description: "Molecular weight",
  },
  {
    id: "purity_pct",
    accessorKey: "purity_pct",
    header: "Purity (%)",
    type: "float",
    size: 100,
    description: "Measured purity percentage (nullable)",
  },
  {
    id: "replicates",
    accessorKey: "replicates",
    header: "Replicates",
    type: "integer",
    size: 100,
    description: "Number of experimental replicates",
  },
  {
    id: "is_active",
    accessorKey: "is_active",
    header: "Active",
    type: "boolean",
    size: 80,
    description: "Whether the compound is in active use",
  },
  {
    id: "homepage",
    accessorKey: "homepage",
    header: "Reference",
    type: "url",
    size: 220,
    description: "External reference URL (nullable)",
  },
  {
    id: "record",
    accessorKey: "record",
    header: "Record",
    type: "localurl",
    size: 160,
    description: "Internal record path",
  },
  {
    id: "registered_on",
    accessorKey: "registered_on",
    header: "Registered",
    type: "date",
    size: 120,
    description: "Date the compound was registered",
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: "Last updated",
    type: "datetime",
    size: 180,
    description: "Timestamp of the last update",
  },
];

/** Deterministic PRNG (mulberry32) — same seed, same sequence. */
const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PROJECTS = ["Oncology", "Neuroscience", "Cardio", "Metabolic", "Immuno"];
const STATUSES = ["Registered", "In progress", "Validated", "Archived"];
const PREFIXES = ["GRT", "AX", "BMX", "KDR", "ZP", "NVX"];
const ADJECTIVES = [
  "potent",
  "selective",
  "reversible",
  "covalent",
  "allosteric",
  "novel",
];
const TARGETS = [
  "kinase inhibitor",
  "GPCR agonist",
  "ion channel modulator",
  "protease substrate",
  "receptor antagonist",
];

/** Base epoch for date generation, kept fixed so output stays deterministic. */
const BASE_DATE = new Date("2024-01-01T00:00:00Z").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

export const generateSampleData = (count = 50): SampleRow[] => {
  const rng = createRng(0x9e3779b9);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;
  const randInt = (min: number, max: number) =>
    Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min: number, max: number, decimals = 2) =>
    Number((rng() * (max - min) + min).toFixed(decimals));
  /** Returns the value, or null with the given probability. */
  const maybeNull = <T,>(value: T, nullChance = 0.15): T | null =>
    rng() < nullChance ? null : value;

  return Array.from({ length: count }, (_, index): SampleRow => {
    const id = index + 1;
    const registeredOffset = randInt(0, 540);
    const registered = new Date(BASE_DATE + registeredOffset * DAY_MS);
    const updated = new Date(
      registered.getTime() + randInt(0, 120) * DAY_MS + randInt(0, 86400) * 1000,
    );

    const code = `${pick(PREFIXES)}-${String(randInt(1000, 9999))}`;

    return {
      id,
      compound_name: code,
      project: pick(PROJECTS),
      status: pick(STATUSES),
      description: maybeNull(
        `A ${pick(ADJECTIVES)} ${pick(TARGETS)} (${code}).`,
        0.2,
      ),
      concentration_um: maybeNull(randFloat(0.01, 100, 2)),
      molecular_weight: randFloat(120, 780, 2),
      purity_pct: maybeNull(randFloat(80, 99.9, 1)),
      replicates: randInt(1, 6),
      is_active: rng() > 0.35,
      homepage: maybeNull(`https://pubchem.example.org/compound/${id}`, 0.25),
      record: `/registry/compounds/${id}`,
      registered_on: `${registered.getUTCFullYear()}-${pad(
        registered.getUTCMonth() + 1,
      )}-${pad(registered.getUTCDate())}`,
      updated_at: `${updated.getUTCFullYear()}-${pad(
        updated.getUTCMonth() + 1,
      )}-${pad(updated.getUTCDate())} ${pad(updated.getUTCHours())}:${pad(
        updated.getUTCMinutes(),
      )}`,
    };
  });
};

export const sampleData = generateSampleData();
