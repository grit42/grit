import { Tabs } from "@grit42/client-library/components";
import { useState } from "react";
import styles from "./vocabulary.module.scss";
import VocabularyLoadSets from "./VocabularyLoadSets";
import VocabularyItemsTable from "./VocabularyItemsTable";

interface Props {
  vocabularyId: string | number;
}

const VocabularyTabs = ({ vocabularyId }: Props) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (vocabularyId === "new") return null;

  return (
    <div className={styles.vocabularyTabsContainer}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.vocabularyTabs}
        tabs={[
          {
            key: "items",
            name: "Items",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <VocabularyItemsTable vocabularyId={vocabularyId} />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <VocabularyLoadSets vocabularyId={vocabularyId} />,
          },
        ]}
      />
    </div>
  );
};

export default VocabularyTabs;
