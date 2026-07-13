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
import styles from "./assayModels.module.scss";
import AssayModelForm from "./AssayModelForm";
import { useAssayModel } from "../../../queries/assay_models";
import { useMemo } from "react";

const CloneAssayModelPage = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const assayModel = useAssayModel(assay_model_id);

  const data = useMemo(() => {
    if (!assayModel.data) {
      return {};
    }
    return { ...assayModel.data, id: 0 };
  }, [assayModel.data]);

  if (assayModel.isLoading) {
    return <Spinner />;
  }

  if (assayModel.isError || !assayModel.data) {
    return (
      <ErrorPage error={assayModel.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }
  return (
    <div className={styles.newAssayModelPage}>
      <div className={styles.header}>
        <h1>Clone {assayModel.data?.name ?? "Assay model"}</h1>
      </div>
      <Surface>
        <AssayModelForm assayModel={data} />
      </Surface>
    </div>
  );
};

export default CloneAssayModelPage;
