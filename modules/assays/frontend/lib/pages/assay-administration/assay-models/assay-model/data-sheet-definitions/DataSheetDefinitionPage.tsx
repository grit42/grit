import {
  Button,
  ErrorPage,
  LoadingPage,
  RoutedTabs,
} from "@grit42/client-library/components";
import { Link, useParams } from "react-router-dom";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import styles from "./dataSheetDefinition.module.scss";
import { useAssayDataSheetDefinition } from "../../../../../queries/assay_data_sheet_definitions";
const DataSheetDefinitionPage = () => {
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string;
  };

  const data = useAssayDataSheetDefinition(data_sheet_definition_id);

  if (data.isLoading) {
    return <LoadingPage />;
  }

  if (data.isError || !data.data) {
    return (
      <ErrorPage error={data.error}>
        <Link to=".." relative="path">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <RoutedTabs
      heading={
        <div className={styles.header}>
          <div className={styles.title}>
            <Link to=".." relative="path">
              <Button
                variant="transparent"
                size="tiny"
                icon={<BackIcon height={24} fill="white" />}
              ></Button>
            </Link>
            <h1>{data.data.name}</h1>
          </div>
          <p>{data.data.description ?? "No description provided"}</p>
        </div>
      }
      matchPattern="/core/administration/assay-models/:assay_model_id/data-sheets/:data_sheet_id/:tab/*"
      navigationPattern="relative-sibling"
      paramName="tab"
      tabs={[
        {
          label: "Columns",
          url: "columns",
        },
        {
          label: "Settings",
          url: "settings",
        },
      ]}
    />
  );
};

export default DataSheetDefinitionPage;
