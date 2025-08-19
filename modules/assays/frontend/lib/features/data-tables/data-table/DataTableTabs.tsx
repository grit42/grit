import DataTableRowsTable from "./DataTableRowsTable";

interface Props {
  dataTableId: string | number;
}

const DataTableTabs = ({ dataTableId }: Props) => {

  if (dataTableId === "new") return null;

  return (
    <div
      style={{
        maxHeight: "100%",
        height: "100%",
        overflow: "auto",
        width: "100%",
      }}
    >
      <DataTableRowsTable dataTableId={dataTableId} />
      {/* <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.dataTableTabs}
        tabs={[
          {
            key: "items",
            name: "Items",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: <DataTableRowsTable vocabularyId={vocabularyId} />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: <VocabularyLoadSets vocabularyId={vocabularyId} />,
          },
        ]}
      /> */}
    </div>
  );
};

export default DataTableTabs;
