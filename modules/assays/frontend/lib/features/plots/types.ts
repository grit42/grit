interface ExcludedRecord {
  usubjid: string;
  studyid: string;
  reason: string;
}

interface ExclusionSummary {
  reason: string;
  count: number;
  studyIds: string[];
}

interface PlotDataSummary {
  totalSubjects: number;
  includedMale: number;
  includedFemale: number;
  includedTotal: number;
  excluded: ExcludedRecord[];
  exclusionSummary: ExclusionSummary[];
}

interface QueryReport {
  generatedAt: string;
  queryParameters: Record<string, any>;
  dataOverview: {
    totalStudies: number;
    totalSubjects: number;
  };
  plotReports: {
    plotName: string;
    summary: PlotDataSummary;
  }[];
}

export type { ExcludedRecord, ExclusionSummary, PlotDataSummary, QueryReport };
