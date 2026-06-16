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

import { useEditEntityMutation } from "@grit42/core";
import {
  AnalysisData,
  useAnalysisContext,
} from "../../../../features/analyses";
import { Grit42QueryBuilder } from "../../../../features/query-builder";
import { useQueryClient } from "@grit42/api";
import { TabbedLayout } from "@grit42/client-library/layouts";
import { Button } from "@grit42/client-library/components";

const FiltersPage = () => {
  const queryClient = useQueryClient();
  const { analysis, filters } = useAnalysisContext();

  const editEntityMutation = useEditEntityMutation<AnalysisData>(
    "grit/assays/analyses",
    analysis.id ?? -1,
    {
      onSuccess: () => {
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: [
              "entities",
              "datum",
              "grit/assays/analyses",
              analysis.id.toString(),
            ],
          }),
          queryClient.invalidateQueries({
            exact: false,
            queryKey: [
              "entities",
              "infiniteData",
              `grit/assays/analyses/${analysis.id}/analysis_records`,
            ],
          }),
        ]);
      },
    },
  );

  const onSave = async () => {
    await editEntityMutation.mutateAsync({ filters: filters.tree });
  };

  return (
    <TabbedLayout>
      <Button onClick={onSave}>Save</Button>
      <Grit42QueryBuilder
        state={filters.builderState}
        setState={filters.setBuilderState}
        setTree={filters.setTree}
      />
    </TabbedLayout>
  );
};

export default FiltersPage;
