import { EntityData, EntityPropertyDef } from "@grit42/core";
import { nullish, SourceData, SourceDatum } from "@grit42/plots";
import { ExcludedRecord, ExclusionSummary, PlotDataSummary } from "./types";

/**
 * Coerces entity records into the shape the @grit42/plots `Plot` component
 * expects: non-numeric properties are stringified (decimals are left as-is so
 * they remain numeric), and booleans are normalised to "true"/"false".
 */
export const getPlotData = (
  data: EntityData[],
  properties: EntityPropertyDef[],
): SourceData => {
  const propsToConvert = properties.filter(
    ({ type }) => !["integer", "string", "text", "entity"].includes(type),
  );
  if (!propsToConvert.length) return data as SourceData;
  return data.map((d) => {
    const datum = { ...d };
    for (const prop of propsToConvert) {
      if (!nullish(datum[prop.name])) {
        datum[prop.name] =
          prop.type === "decimal" ? datum[prop.name] : `${datum[prop.name]}`;
      } else if (prop.type === "boolean") {
        datum[prop.name] = (!!datum[prop.name]).toString();
      }
    }
    return datum as SourceDatum;
  });
};

interface FilteredSubjects {
  included: {
    male: any[];
    female: any[];
  };
  summary: PlotDataSummary;
}

export const buildExclusionSummary = (
  excluded: ExcludedRecord[],
): ExclusionSummary[] => {
  const grouped = new Map<string, { count: number; studyIds: Set<string> }>();

  for (const record of excluded) {
    const existing = grouped.get(record.reason);
    if (existing) {
      existing.count += 1;
      existing.studyIds.add(record.studyid);
    } else {
      grouped.set(record.reason, {
        count: 1,
        studyIds: new Set([record.studyid]),
      });
    }
  }

  return Array.from(grouped.entries()).map(([reason, data]) => ({
    reason,
    count: data.count,
    studyIds: Array.from(data.studyIds),
  }));
};

export const filterSubjectsByValue = (
  subjectsData: any[],
  valueKey: string,
): FilteredSubjects => {
  const male: any[] = [];
  const female: any[] = [];
  const excluded: ExcludedRecord[] = [];

  for (const subj of subjectsData) {
    const sex = subj.sex;
    if (sex !== "M" && sex !== "F") {
      excluded.push({
        usubjid: subj.usubjid ?? "unknown",
        studyid: String(subj.studyid ?? "unknown"),
        reason: "Missing or invalid sex",
      });
      continue;
    }

    const rawValue = subj[valueKey];
    if (rawValue == null) {
      excluded.push({
        usubjid: subj.usubjid ?? "unknown",
        studyid: String(subj.studyid ?? "unknown"),
        reason: `Missing value for ${valueKey}`,
      });
      continue;
    }

    const y = Number(rawValue);
    if (!Number.isFinite(y)) {
      excluded.push({
        usubjid: subj.usubjid ?? "unknown",
        studyid: String(subj.studyid ?? "unknown"),
        reason: `Non-numeric value for ${valueKey}`,
      });
      continue;
    }

    if (sex === "M") male.push(subj);
    else female.push(subj);
  }

  return {
    included: { male, female },
    summary: {
      totalSubjects: subjectsData.length,
      includedMale: male.length,
      includedFemale: female.length,
      includedTotal: male.length + female.length,
      excluded,
      exclusionSummary: buildExclusionSummary(excluded),
    },
  };
};

export const filterSubjectsMultipleValues = (
  subjectsData: any[],
  valueKeys: Array<string>,
): PlotDataSummary => {
  const excluded: ExcludedRecord[] = [];
  let includedCount = 0;

  for (const subj of subjectsData) {
    const missingKeys = valueKeys.filter((key) => {
      const val = subj[key];
      return val == null || !Number.isFinite(Number(val));
    });

    if (missingKeys.length === valueKeys.length) {
      excluded.push({
        usubjid: subj.usubjid ?? "unknown",
        studyid: String(subj.studyid ?? "unknown"),
        reason: "No pre-test values available",
      });
    } else {
      includedCount += 1;
      for (const key of missingKeys) {
        excluded.push({
          usubjid: subj.usubjid ?? "unknown",
          studyid: String(subj.studyid ?? "unknown"),
          reason: `Missing value for ${key}`,
        });
      }
    }
  }

  const maleCount = subjectsData.filter(
    (s) =>
      s.sex === "M" &&
      valueKeys.some((k) => s[k] != null && Number.isFinite(Number(s[k]))),
  ).length;
  const femaleCount = subjectsData.filter(
    (s) =>
      s.sex === "F" &&
      valueKeys.some((k) => s[k] != null && Number.isFinite(Number(s[k]))),
  ).length;

  return {
    totalSubjects: subjectsData.length,
    includedMale: maleCount,
    includedFemale: femaleCount,
    includedTotal: includedCount,
    excluded,
    exclusionSummary: buildExclusionSummary(excluded),
  };
};
