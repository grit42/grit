import { Tabs } from "@grit42/client-library/components";
import {
  DataSetDefinitionFull,
} from "./dataSheetDefinitionEditorForm";
import styles from "../dataSheetStructureLoader.module.scss";
import { useMemo } from "react";

const DataSheetDefinitionEditorTabs = ({
  focusedSheetIndex,
  setFocusedSheetIndex,
  dataSetDefinition,
}: {
  focusedSheetIndex: number;
  setFocusedSheetIndex: (sheetIndex: number) => void;
  dataSetDefinition: DataSetDefinitionFull;
}) => {
  const tabs = useMemo(
    () =>
      dataSetDefinition.sheets.map((sheetDefinition) => ({
        key: sheetDefinition.id.toString(),
        name: sheetDefinition.name,
        panel: <></>,
      })) ?? [],
    [dataSetDefinition.sheets],
  );

  const handleTabChange = (index: number) => {
    setFocusedSheetIndex(index);
  };

  return (
    <Tabs
      className={styles.dataSheetsFormHeader}
      selectedTab={focusedSheetIndex}
      onTabChange={handleTabChange}
      tabs={tabs}
    />
  );
};

export default DataSheetDefinitionEditorTabs;
