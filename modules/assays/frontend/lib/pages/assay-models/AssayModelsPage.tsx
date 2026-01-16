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

import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useAssayModelColumns } from "../../queries/assay_models";
import { useAssayTypeColumns } from "../../queries/assay_types";
import { useLocalStorage } from "@grit42/client-library/hooks";
import AssayTypesTable from "./AssayTypesTable";
import AssayModelsTable from "./AssayModelsTable";
import styles from "./assayModels.module.scss";

const AssayModelsPage = () => {
  const selectedTypesState = useLocalStorage<number[]>(
    "selected-assay-types",
    [],
  );

  const {
    isLoading: isAssayModelColumnsLoading,
    isError: isAssayModelColumnsError,
    error: assayModelColumnsError,
  } = useAssayModelColumns();
  const {
    isLoading: isAssayTypeColumnsLoading,
    isError: isAssayTypeColumnsError,
    error: assayTypeColumnsError,
  } = useAssayTypeColumns();

  if (isAssayModelColumnsLoading || isAssayTypeColumnsLoading) {
    return <Spinner />;
  }

  if (isAssayModelColumnsError || isAssayTypeColumnsError) {
    return (
      <ErrorPage error={assayModelColumnsError ?? assayTypeColumnsError} />
    );
  }

  return (
    <div className={styles.assayModelsPage}
    >
      <AssayTypesTable state={selectedTypesState} />
      <AssayModelsTable selectedTypes={selectedTypesState[0]} />
    </div>
  );
};

export default AssayModelsPage;
