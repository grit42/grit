import { Tabs } from "@grit42/client-library/components";
import {
  defaultFormValues,
  withForm,
} from "./dataSheetDefinitionEditorForm";
import dataSetDefinitionSchema from "./schema";
import { useStore } from "@tanstack/react-form";
import styles from "../dataSheetStructureLoader.module.scss";

const DataSheetDefinitionEditorTabs = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    setFocusedSheetIndex: (() => {}) as (index: number) => void,
    focusedSheetIndex: 0,
  },
  render: function Render({ form, focusedSheetIndex, setFocusedSheetIndex }) {
    const tabs = useStore(
      form.baseStore,
      ({ values }) =>
        values.sheets.map((sheetDefinition) => ({
          key: sheetDefinition.id.toString(),
          name: sheetDefinition.name,
          panel: <></>,
        })) ?? [],
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
  },
});

export default DataSheetDefinitionEditorTabs;
