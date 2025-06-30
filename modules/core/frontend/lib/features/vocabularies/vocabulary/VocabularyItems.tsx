import { Tabs } from "@grit42/client-library/components";
import { useState } from "react";
import styles from "./vocabulary.module.scss"
import VocabularyLoadSets from "./VocabularyLoadSets";
import VocabularyItemsTable from "./VocabularyItemsTable";

interface Props {
  vocabularyId: string | number;
}

const VocabularyTabs = ({ vocabularyId }: Props) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (vocabularyId === "new") return null;

  return (
    <div
      style={{
        maxHeight: "100%",
        height: "100%",
        overflow: "auto",
        width: "100%",
      }}
    >
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.vocabularyTabs}
        tabs={[
          {
            key: "items",
            name: "Items",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: <VocabularyItemsTable vocabularyId={vocabularyId} />,
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
      />
    </div>
  );
};

export default VocabularyTabs;
