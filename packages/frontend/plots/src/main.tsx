import "./index.scss";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Select,
  ThemeProvider,
  ToggleSwitch,
} from "@grit42/client-library/components";
import {
  FigureSummary,
  NOTICE_LEVEL_LABELS,
  NOTICE_LEVELS,
  Plot,
  PlotDataSummaryPanel,
  PlotSettingsPanel,
  Section,
  collectValid,
  countsRows,
  toFiniteNumber,
  type NoticeLevel,
  type PlotDefinition,
  type PlotNotice,
  type SourceDatum,
  type Validator,
} from "@grit42/plots";
import { DATASETS, type Dataset, type DatasetGuide } from "./datasets";

const DATASET_OPTIONS = DATASETS.map(({ id, label }) => ({
  value: id,
  label,
}));

const SAMPLE_NOTICES: Record<NoticeLevel, PlotNotice> = {
  cannot: { kind: "empty", reason: "No records match the host's filter." },
  check: { kind: "warning", reason: "values from two instruments" },
  left: {
    kind: "omitted",
    count: 3,
    reason: "records the host flagged",
    items: ["R-07", "R-12", "R-19"],
  },
  note: { kind: "info", reason: "values as recorded, not normalised" },
};

const present = (value: unknown) =>
  value !== null && value !== undefined && value !== "";

// As a host would: its rules decide the rows, the plot reports the rest.
const summarise = (dataset: Dataset, plot: PlotDefinition) => {
  const label = (key: string) =>
    dataset.properties.find((p) => p.name === key)?.display_name ?? key;
  const validators: Validator<SourceDatum>[] = [
    {
      valid: (row) => present(row[plot.x.key]),
      reason: `${label(plot.x.key)} missing`,
    },
  ];
  if (!countsRows(plot)) {
    validators.push({
      valid: (row) => toFiniteNumber(row[plot.y.key]) !== null,
      reason: `${label(plot.y.key)} missing or not a number`,
    });
  }
  const group = plot.groupBy?.[0];
  const groupOf = group ? (row: SourceDatum) => String(row[group]) : undefined;
  return collectValid(dataset.data, validators, {
    getGroup: groupOf,
    getCategory: groupOf,
  });
};

const Guide = ({ what, markLabel, mark }: DatasetGuide) => (
  <dl className="guide">
    <dt>What it shows</dt>
    <dd>{what}</dd>
    <dt>{markLabel}</dt>
    <dd>{mark}</dd>
  </dl>
);

const Playground = () => {
  const [datasetId, setDatasetId] = useState(DATASETS[0].id);
  const dataset = DATASETS.find((d) => d.id === datasetId) ?? DATASETS[0];
  const [plots, setPlots] = useState<Record<string, PlotDefinition>>({});
  const plot = plots[dataset.id] ?? dataset.plot;
  const setPlot = (next: PlotDefinition) =>
    setPlots((previous) => ({ ...previous, [dataset.id]: next }));

  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");
  const [levels, setLevels] = useState<NoticeLevel[]>([]);
  const toggleLevel = (level: NoticeLevel) =>
    setLevels((shown) =>
      shown.includes(level)
        ? shown.filter((l) => l !== level)
        : [...shown, level],
    );

  const { included, summary } = useMemo(
    () => summarise(dataset, plot),
    [dataset, plot],
  );

  const playgroundControls = (
    <>
      <Section title="Playground" defaultOpen>
        <Button
          onClick={() =>
            setColorScheme((scheme) => (scheme === "dark" ? "light" : "dark"))
          }
        >
          Switch to {colorScheme === "dark" ? "light" : "dark"} scheme
        </Button>
        <Select
          label="Dataset"
          options={DATASET_OPTIONS}
          value={dataset.id}
          isClearable={false}
          description={dataset.description}
          onChange={(id: string) => setDatasetId(id)}
        />
      </Section>
      <Section title="Host notices">
        {NOTICE_LEVELS.map((level) => (
          <ToggleSwitch
            key={level}
            label={NOTICE_LEVEL_LABELS[level]}
            value={levels.includes(level)}
            onChange={() => toggleLevel(level)}
          />
        ))}
      </Section>
    </>
  );

  return (
    <ThemeProvider colorScheme={colorScheme}>
      <div
        style={{
          height: "100%",
          boxSizing: "border-box",
          padding: "var(--spacing-md)",
        }}
      >
        <PlotSettingsPanel
          plot={plot}
          data={included}
          properties={dataset.properties}
          onChange={setPlot}
          before={playgroundControls}
        >
          <FigureSummary
            summary={
              <PlotDataSummaryPanel
                summary={summary}
                recordLabel={dataset.recordLabel}
              />
            }
            guide={<Guide {...dataset.guide} />}
          >
            <Plot
              def={plot}
              data={included}
              dataProperties={dataset.properties}
              notices={NOTICE_LEVELS.filter((level) =>
                levels.includes(level),
              ).map((level) => SAMPLE_NOTICES[level])}
              onChange={setPlot}
              annotationAuthor="playground"
            />
          </FigureSummary>
        </PlotSettingsPanel>
      </div>
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
