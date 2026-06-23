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
import { Link, Outlet, useMatch } from "react-router-dom";
import { useVocabulary } from "../../queries/vocabularies";
import { useHasPermission } from "../../../auth";
import { Button } from "@grit42/client-library/components";
import VocabularyItemsTable from "./VocabularyItemsTable";

interface Props {
  vocabularyId: string | number;
}

const Vocabulary = ({ vocabularyId }: Props) => {
  const canAdmin = useHasPermission("admin:vocabularies");
  const match = useMatch("/core/vocabularies/:vocabulary_id/items");

  const { data: vocabulary } = useVocabulary(vocabularyId);

  if (!match) {
    return <Outlet />;
  }

  return (
    <div className={styles.vocabulary}>
      <div className={styles.vocabularyDetails}>
        <div className={styles.vocabularyDetailsHeader}>
          <h1>{vocabulary?.name}</h1>
          {canAdmin && (
            <Link to="new">
              <Button>New item</Button>
            </Link>
          )}
        </div>
        {vocabulary?.description && <p className={styles.description}>{vocabulary?.description}</p>}
      </div>
      <VocabularyItemsTable vocabularyId={vocabularyId} />
    </div>
  );
};

export default Vocabulary;
