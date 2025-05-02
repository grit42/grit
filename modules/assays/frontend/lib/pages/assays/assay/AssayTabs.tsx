import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, Route, Routes, useMatch, useNavigate, useParams } from "react-router-dom";
import { useAssay, useAssayExperiments } from "../../../queries/assays";
import { AssayDataSheetDefinitionData, useAssayDataSheetDefinitions } from "../../../queries/assay_data_sheet_definitions";
import { Spinner, ErrorPage, Tabs } from "@grit/client-library/components";
import { useExperimentColumns } from "../../../queries/experiments";
import AssayExperiments from "./Experiments";
import AssayDataSheet from "./data-sheet";

const AssayTabs = ({ dataSheets }: { dataSheets: AssayDataSheetDefinitionData[] }) => {
  const navigate = useNavigate();
  const match = useMatch("/assays/assays/:assay_id/sheets/:tab/*");

  const tabs = useMemo(
    () => [
      { url: "experiments", label: "Experiments" },
      ...(dataSheets ?? []).map(
        ({ id, name }) => ({
          url: `sheets/${id.toString()}`,
          label: name,
        }),
      ),
    ],
    [dataSheets],
  );

  const tab = match?.params.tab ?? "experiments";

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
  );

  useEffect(() => {
    setSelectedTab(
      tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
    );
  }, [tab]);

  const handleTabChange = (index: number) => {
    navigate(tabs[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={tabs.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Outlet />
    </div>
  );
};

const AssayTabsWrapper = () => {
  const { assay_id } = useParams() as { assay_id: string };
  const {
    data: assay,
    isLoading: isAssayLoading,
    isError: isAssayError,
    error: assayError,
  } = useAssay(assay_id);

  const {
    data: dataSheets,
    isLoading: isDataSheetsLoading,
    isError: isDataSheetsError,
    error: dataSheetError,
  } = useAssayDataSheetDefinitions(
    assay?.assay_model_id ?? -1,
    undefined,
    undefined,
    undefined,
    {
      enabled: !!assay,
      select: (data) => data.filter(({result}) => result)
    },
  );

  const {
    data: experimentColumns,
    isLoading: isExperimentColumnsLoading,
    isError: isExperimentColumnsError,
    error: experimentColumnsError,
  } = useExperimentColumns();

  useAssayExperiments(assay_id);

  if (isAssayLoading || isExperimentColumnsLoading || isDataSheetsLoading) {
    return <Spinner />;
  }

  if (
    isAssayError ||
    isExperimentColumnsError ||
    isDataSheetsError ||
    !assay ||
    !dataSheets ||
    !experimentColumns
  ) {
    return (
      <ErrorPage
        error={assayError ?? dataSheetError ?? experimentColumnsError}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AssayTabs dataSheets={dataSheets} />}>
        <Route path="experiments" element={<AssayExperiments assayId={assay_id} />} />
        <Route path={`sheets/:sheet_id/*`} element={<AssayDataSheet dataSheets={dataSheets} />} />
        <Route path="*" element={<Navigate to="experiments" replace />} />
      </Route>
    </Routes>
  );
};

export default AssayTabsWrapper;
