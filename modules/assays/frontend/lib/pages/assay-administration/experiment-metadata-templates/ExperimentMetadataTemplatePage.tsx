/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import styles from "./experimentMetadataTemplates.module.scss";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteMetadataTemplate from "./DeleteMetadataTemplate";
import { useExperimentMetadataTemplate } from "../../../queries/experiment_metadata_templates";
import { useAssayMetadataDefinitionsWithFields } from "./useAssayMetadataDefinitionsWithFields";
import ExperimentMetadataTemplateForm from "./ExperimentMetadataTemplateForm";
import { useMetadataTemplateAdministrationBreadcrumbs } from "./breadcrumbs";

const ExperimentMetadataTemplatePage = () => {
  const { metadata_template_id } = useParams() as { metadata_template_id: string };
  useMetadataTemplateAdministrationBreadcrumbs();

  const metadataDefinitions = useAssayMetadataDefinitionsWithFields();

  const metadataTemplate = useExperimentMetadataTemplate(
    metadata_template_id,
  );

  if (metadataTemplate.isLoading || metadataDefinitions.isLoading) {
    return <Spinner />;
  }

  if (
    metadataDefinitions.isError ||
    !metadataDefinitions.data ||
    metadataTemplate.isError ||
    !metadataTemplate.data
  ) {
    return (
      <ErrorPage error={metadataTemplate.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.metadataTemplatePage}>
      <div className={styles.header}>
        <Link to="/core/administration/metadata-templates">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>Edit metadata template</h1>
      </div>
      <Surface>
        <ExperimentMetadataTemplateForm metadataTemplate={metadataTemplate.data} metadataFields={metadataDefinitions.fields} />
        <DeleteMetadataTemplate metadataTemplate={metadataTemplate.data} />
      </Surface>
    </div>
  );
};

export default ExperimentMetadataTemplatePage;
