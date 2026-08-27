/**
 * Regenerates `send.ts` from the synthetic SEND datasets in
 * `./SEND_examples` (see the README there for provenance).
 *
 * Tests import the generated `send.ts`; subjects sorted by USUBJID,
 * first N per SEX × ARM cell.
 *
 *   node packages/frontend/plots/test/fixtures/generate-send-fixtures.mjs [csvDir]
 *
 * `csvDir` (or SEND_DIR) overrides the data, e.g. to regenerate from
 * a fuller export.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const SEND_DIR =
  process.argv[2] ?? process.env.SEND_DIR ?? join(HERE, "SEND_examples");

/** Subjects kept per SEX × ARM cell. 5 gives usable n for SD/SEM and t-tests. */
const SUBJECTS_PER_CELL = 5;
const LAB_TESTS = ["HGB", "WBC", "ALT", "CREAT"];

const readCsv = (name) => {
  const text = readFileSync(join(SEND_DIR, `${name}.csv`), "utf8").trim();
  const [header, ...lines] = text.split("\n");
  const cols = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
};

const num = (v) => {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const dm = readCsv("dm");
const byCell = new Map();
for (const s of [...dm].sort((a, b) => a.USUBJID.localeCompare(b.USUBJID))) {
  const key = `${s.SEX}|${s.ARMCD}`;
  const cell = byCell.get(key) ?? [];
  if (cell.length < SUBJECTS_PER_CELL) cell.push(s);
  byCell.set(key, cell);
}
const subjects = [...byCell.values()].flat();
const keep = new Map(subjects.map((s) => [s.USUBJID, s]));

const subjectCols = (usubjid) => {
  const s = keep.get(usubjid);
  return { SEX: s.SEX, ARM: s.ARM, ARMCD: s.ARMCD };
};

const subjectRows = subjects.map((s) => ({
  USUBJID: s.USUBJID,
  SUBJID: s.SUBJID,
  SEX: s.SEX,
  ARM: s.ARM,
  ARMCD: s.ARMCD,
  SPECIES: s.SPECIES,
  STRAIN: s.STRAIN,
  AGE: num(s.AGE),
  AGEU: s.AGEU,
}));

const bwRows = readCsv("bw")
  .filter((r) => keep.has(r.USUBJID))
  .map((r) => ({
    USUBJID: r.USUBJID,
    ...subjectCols(r.USUBJID),
    BWTESTCD: r.BWTESTCD,
    BWTEST: r.BWTEST,
    BWSTRESN: num(r.BWSTRESN),
    BWSTRESU: r.BWSTRESU,
    BWBLFL: r.BWBLFL,
    VISIT: r.VISIT,
    VISITDY: num(r.VISITDY),
    BWDY: num(r.BWDY),
  }));

const lbRows = readCsv("lb")
  .filter((r) => keep.has(r.USUBJID) && LAB_TESTS.includes(r.LBTESTCD))
  .map((r) => ({
    USUBJID: r.USUBJID,
    ...subjectCols(r.USUBJID),
    LBTESTCD: r.LBTESTCD,
    LBTEST: r.LBTEST,
    LBSTRESN: num(r.LBSTRESN),
    LBSTRESU: r.LBSTRESU,
    LBSTNRLO: num(r.LBSTNRLO),
    LBSTNRHI: num(r.LBSTNRHI),
    LBNRIND: r.LBNRIND,
    VISITDY: num(r.VISITDY),
    LBDY: num(r.LBDY),
  }));

const clRows = readCsv("cl")
  .filter((r) => keep.has(r.USUBJID))
  .map((r) => ({
    USUBJID: r.USUBJID,
    ...subjectCols(r.USUBJID),
    CLTESTCD: r.CLTESTCD,
    CLTEST: r.CLTEST,
    CLSTRESC: r.CLSTRESC,
    CLLOC: r.CLLOC,
    CLSEV: r.CLSEV,
    CLDY: num(r.CLDY),
  }));

const DECIMAL = new Set(["BWSTRESN", "LBSTRESN", "LBSTNRLO", "LBSTNRHI"]);
const INTEGER = new Set(["AGE", "VISITDY", "BWDY", "LBDY", "CLDY"]);

const TITLES = {
  USUBJID: "Subject",
  SUBJID: "Subject ID",
  SEX: "Sex",
  ARM: "Treatment group",
  ARMCD: "Arm code",
  SPECIES: "Species",
  STRAIN: "Strain",
  AGE: "Age",
  AGEU: "Age unit",
  BWTESTCD: "Test code",
  BWTEST: "Test",
  BWSTRESN: "Body weight",
  BWSTRESU: "Body weight unit",
  BWBLFL: "Baseline flag",
  VISIT: "Visit",
  VISITDY: "Visit day",
  BWDY: "Study day",
  LBTESTCD: "Test code",
  LBTEST: "Test",
  LBSTRESN: "Result",
  LBSTRESU: "Unit",
  LBSTNRLO: "Reference range low",
  LBSTNRHI: "Reference range high",
  LBNRIND: "Reference range indicator",
  LBDY: "Study day",
  CLTESTCD: "Observation code",
  CLTEST: "Observation",
  CLSTRESC: "Result",
  CLLOC: "Location",
  CLSEV: "Severity",
  CLDY: "Study day",
};

const propsFor = (rows) =>
  Object.keys(rows[0]).map((name) => ({
    name,
    display_name: TITLES[name] ?? name,
    type: DECIMAL.has(name)
      ? "decimal"
      : INTEGER.has(name)
        ? "integer"
        : "string",
  }));

const lit = (rows) =>
  `[\n${rows.map((r) => `  ${JSON.stringify(r)},`).join("\n")}\n]`;

const block = (name, rows, desc) => `
/** ${desc} (${rows.length} rows). */
export const ${name}: SourceData = ${lit(rows)};

export const ${name}Properties: SourceDataProperties = ${lit(propsFor(rows))};
`;

const out = `/* eslint-disable */
// GENERATED FILE — do not edit by hand. Regenerate with:
//   node packages/frontend/plots/test/fixtures/generate-send-fixtures.mjs
//
// Derived from the synthetic SEND datasets in ./SEND_examples (see the README
// there for provenance), trimmed to ${SUBJECTS_PER_CELL} subjects per sex × treatment-arm
// cell (${subjects.length} subjects total) and, for laboratory results, to the tests
// ${LAB_TESTS.join(", ")}.
//
// Demographics columns (SEX, ARM, ARMCD) are denormalised onto every findings
// row so plots can group and facet without a join.

import type { SourceData, SourceDataProperties } from "../../lib/types";
${block("sendSubjects", subjectRows, "SEND DM — demographics, one row per subject")}${block("sendBodyWeights", bwRows, "SEND BW — body weight over time; BWBLFL marks the day-0 baseline")}${block("sendLabs", lbRows, "SEND LB — laboratory results with reference ranges; LBNRIND is N/H/L")}${block("sendClinicalObservations", clRows, "SEND CL — clinical observations with severity")}`;

const target = join(HERE, "send.ts");
writeFileSync(target, out);
console.log(
  `wrote ${target}\n  subjects: ${subjectRows.length}\n  body weights: ${bwRows.length}\n  labs: ${lbRows.length}\n  clinical observations: ${clRows.length}`,
);
