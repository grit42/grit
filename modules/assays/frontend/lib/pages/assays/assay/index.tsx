import { Link, useParams } from "react-router-dom";
import {
  useAssay,
  useAssayExperiments,
  useAssayFields,
} from "../../../queries/assays";
import {
  Spinner,
  ErrorPage,
  ButtonGroup,
  Button,
} from "@grit/client-library/components";
import { useExperimentColumns } from "../../../queries/experiments";
import styles from "../assays.module.scss";
import AssayDetails from "./Details";
import AssayTabsWrapper from "./AssayTabs";
import { useHasRoles } from "@grit/core";

const AssayPage = () => {
  const canCreateExperiment = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])
  const { assay_id } = useParams() as { assay_id: string };
  const {
    data: assay,
    isLoading: isAssayLoading,
    isError: isAssayError,
    error: assayError,
  } = useAssay(assay_id);
  const {
    data: assayFields,
    isLoading: isAssayFieldsLoading,
    isError: isAssayFieldsError,
    error: assayFieldsError,
  } = useAssayFields(
    { assay_id },
    {
      select: (data) =>
        data.filter(({ metadata_definition_id }) => !!metadata_definition_id),
    },
  );
  const {
    data: experimentColumns,
    isLoading: isExperimentColumnsLoading,
    isError: isExperimentColumnsError,
    error: experimentColumnsError,
  } = useExperimentColumns();

  useAssayExperiments(assay_id);

  if (isAssayLoading || isExperimentColumnsLoading || isAssayFieldsLoading) {
    return <Spinner />;
  }

  if (
    isAssayError ||
    isExperimentColumnsError ||
    isAssayFieldsError ||
    !assay ||
    !assayFields ||
    !experimentColumns
  ) {
    return (
      <ErrorPage
        error={assayError ?? assayFieldsError ?? experimentColumnsError}
      />
    );
  }

  return (
    <div className={styles.assay}>
      <div className={styles.header}>
        <h1 className={styles.title}>{assay.name}</h1>
        {canCreateExperiment && <ButtonGroup>
          <Link to={`/assays/experiments/new?assay_id=${assay_id}`}>
            <Button color="secondary">New experiment</Button>
          </Link>
        </ButtonGroup>}
      </div>
      <AssayDetails assay={assay} />
      <div
        style={{
          gridArea: "d",
          height: "100%",
          width: "100%",
          overflow: "auto",
        }}
      >
        <AssayTabsWrapper />
      </div>
    </div>
  );
};

export default AssayPage;
