/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import { useParams } from "react-router-dom";
import {
  CompoundData,
  useCompound,
  useCompoundFields,
} from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./compoundCv.module.scss";
import { GeneralInfo, CalculatedProps } from "./compoundCVInfo";
import { CompoundCVResultsTable } from "./CompoundCVResultsTable";

const MoleculeViewer = ({ compound }: { compound: CompoundData }) => {
  return (
    <div className={styles.moleculeContainer}>
      {compound.molecule ? (
        <AsyncMoleculeViewer molfile={compound.molecule} />
      ) : (
        "No molecule data available."
      )}
    </div>
  );
};

const CompoundCV = () => {
  const { id } = useParams() as { id: string };
  const { data: compound } = useCompound(id);

  return (
    <div className={styles.Container}>
      <Surface style={{ width: "100%", height: "100%" }}>
        <div className={styles.leftSideContainer}>
          {compound && <MoleculeViewer compound={compound} />}
          {compound && <GeneralInfo compound={compound} />}
          {compound && <CalculatedProps compound={compound} />}
        </div>
      </Surface>
      <Surface style={{ width: "100%", height: "100%" }}>
        <div className={styles.resultsTableContainer}>
        {compound && <CompoundCVResultsTable compound={compound} />}
        </div>
      </Surface>
    </div>
  )
};

const CompoundCVPage = () => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields();

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return <CompoundCV />;
};

export default CompoundCVPage;
