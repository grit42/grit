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
import styles from "./assayMetadataDefinitions.module.scss";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteMetadataDefinition from "./DeleteMetadataDefinition";
import { useAssayMetadataDefinition } from "../../../queries/assay_metadata_definitions";
import AssayMetadataDefinitionForm from "./AssayMetadataDefinitionForm";
import { useMetadataDefinitionAdministrationBreadcrumbs } from "./breadcrumbs";

const AssayMetadataDefinitionPage = () => {
  const { metadata_definition_id } = useParams() as {
    metadata_definition_id: string;
  };
  useMetadataDefinitionAdministrationBreadcrumbs();
  const metadataDefinition = useAssayMetadataDefinition(metadata_definition_id);

  if (metadataDefinition.isLoading) {
    return <Spinner />;
  }

  if (metadataDefinition.isError || !metadataDefinition.data) {
    return (
      <ErrorPage error={metadataDefinition.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.metadataDefinitionPage}>
      <div className={styles.header}>
        <Link to="/core/administration/metadata-definitions">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="var(--palette-background-contrast-text)" />}
          ></Button>
        </Link>
        <h1>Edit metadata definition</h1>
      </div>
      <Surface>
        <AssayMetadataDefinitionForm
          assayMetadataDefinition={metadataDefinition.data}
        />
        <DeleteMetadataDefinition
          metadataDefinition={metadataDefinition.data}
        />
      </Surface>
    </div>
  );
};

export default AssayMetadataDefinitionPage;
