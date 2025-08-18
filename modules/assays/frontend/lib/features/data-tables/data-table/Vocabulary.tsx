/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./vocabulary.module.scss";
import { Outlet } from "react-router-dom";
import {
  useDataTable,
  useDataTableFields,
} from "../queries/data_tables";
import { useHasRoles } from "@grit42/core";
import VocabularyForm from "./VocabularyForm";

interface Props {
  vocabularyId: string | number;
}

const Vocabulary = ({ vocabularyId }: Props) => {
  const canEditVocabularies = useHasRoles(["Administrator", "VocabularyAdministrator"])
  const { data: vocabulary } = useDataTable(vocabularyId);
  const { data: vocabularyFields } = useDataTableFields(undefined, {
    select: (data) =>
      canEditVocabularies ? data : data.map((f) => ({ ...f, disabled: true })),
  });

  return (
    <div className={styles.vocabulary}>
      <VocabularyForm fields={vocabularyFields!} vocabulary={vocabulary!} />
      <Outlet />
    </div>
  );
};

export default Vocabulary;
