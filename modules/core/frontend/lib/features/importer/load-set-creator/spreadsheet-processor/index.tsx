import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Tabs,
} from "@grit42/client-library/components";
import { AnyFormApi, AnyFormState, Form, useForm } from "@grit42/form";
import { TabbedLayout } from "@grit42/client-library/layouts";
import { useState } from "react";
import SheetForm from "./SheetForm";
import styles from "./spreadsheetProcessor.module.scss";
import { useQuery } from "@grit42/api";
import { extractSheetRange, sheetsFromFile, WorkbookSheet } from "./utils";

const Header = ({
  form,
  onCancel,
}: {
  form: AnyFormApi;
  onCancel: () => void;
}) => {
  const Subscribe = (form as any).Subscribe;

  return (
    <div className={styles.header}>
      <h1>Process spreadsheets</h1>
      <Subscribe
        selector={(state: AnyFormState) => [
          state.canSubmit,
          state.isSubmitting,
        ]}
        children={([canSubmit, isSubmitting]: [boolean, boolean]) => {
          return (
            <ButtonGroup>
              <Button onClick={onCancel}>Cancel</Button>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
              >
                Continue
              </Button>
            </ButtonGroup>
          );
        }}
      />
    </div>
  );
};

const useSheetsFromFiles = (files: File[]) => {
  return useQuery({
    queryKey: [
      "sheetsFromFiles",
      files.flatMap(({ name, size, lastModified }) => [
        name,
        size,
        lastModified,
      ]),
    ].flat(),
    queryFn: async () => {
      return (await Promise.all(files.map((wb) => sheetsFromFile(wb)))).flat();
    },
  });
};

const SpreadsheetProcessorForm = ({
  sheets,
  onCancel,
  onProcessed,
}: {
  sheets: WorkbookSheet[];
  onProcessed: (data: WorkbookSheet[]) => Promise<void> | void;
  onCancel: () => void;
}) => {
  const form = useForm({
    defaultValues: { sheets },
    onSubmit: async ({ value }) => {
      const processedSheets = await Promise.all(
        value.sheets.filter(({ included }) => included).map(extractSheetRange),
      );
      onProcessed(processedSheets);
    },
  });

  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Form form={form} className={styles.loadSetBlockRefinerForm}>
      <TabbedLayout>
        <Header form={form} onCancel={onCancel} />
        <Tabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          className={styles.loadSetBlockRefinerTabs}
          tabs={sheets.map((sheet, index) => ({
            key: sheet.id,
            name: sheet.name,
            panelProps: {
              className: styles.loadSetBlockRefinerTab,
            },
            panel: <SheetForm sheetIndex={index} form={form} />,
          }))}
        />
      </TabbedLayout>
    </Form>
  );
};

const SpreadsheetProcessor = ({
  files,
  onProcessed,
  onCancel,
}: {
  files: File[];
  onProcessed: (data: WorkbookSheet[]) => Promise<void> | void;
  onCancel: () => void;
}) => {
  const { data: sheets, isLoading, isError, error } = useSheetsFromFiles(files);
  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !sheets) {
    return (
      <ErrorPage error={error?.message}>
        <Button onClick={onCancel}>Back</Button>
      </ErrorPage>
    );
  }

  return (
    <SpreadsheetProcessorForm
      sheets={sheets}
      onProcessed={onProcessed}
      onCancel={onCancel}
    />
  );
};
export default SpreadsheetProcessor;
