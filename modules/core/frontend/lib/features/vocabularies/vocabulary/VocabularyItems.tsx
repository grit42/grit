import { Tabs } from "@grit42/client-library/components";
import { useState } from "react";
import styles from "./vocabulary.module.scss"
import VocabularyLoadSets from "./VocabularyLoadSets";
import VocabularyItemsTable from "./VocabularyItemsTable";

interface Props {
  vocabularyId: string | number;
}

const VocabularyTabs = ({ vocabularyId }: Props) => {
//   const pathname = useLocation().pathname;
//   const { data, isLoading, isError, error } = useEntity(entity);
  const [selectedTab, setSelectedTab] = useState(0);

//   const registerToolbarActions = useToolbar();
//   const navigate = useNavigate();

//   useEffect(() => {
//     return registerToolbarActions({
//       importItems: [
//         {
//           id: "IMPORT",
//           onClick: () => navigate(`/core/load_sets/new?entity=${entity}`),
//           text: `Import ${entity}`,
//         },
//       ],
//     });
//   }, [entity, pathname, data, navigate, registerToolbarActions]);

//   if (isLoading) {
//     return <Spinner />;
//   }

//   if (isError || !data) {
//     return <ErrorPage error={error} />;
//   }

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
