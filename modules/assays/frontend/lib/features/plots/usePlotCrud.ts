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

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import { EntityProperties, useEditEntityMutation } from "@grit42/core";
import { generateUniqueID } from "@grit42/client-library/utils";

interface PlotEntity<P> {
  id: string | number;
  plots: Record<string, P>;
}

interface UsePlotCrudOptions<
  T extends EntityProperties,
  P extends { id: string },
> {
  /** Entity endpoint path, e.g. "grit/assays/data_tables" */
  entityPath: string;
  /** The parent entity holding the plots */
  entity: T & PlotEntity<P>;
  /** Factory for a fresh "new" plot definition */
  getDefaultPlot: () => P;
  /**
   * Extra values that, when changed, should re-seed the local plot state from
   * the entity (in addition to plot_id and entity.plots). Experiments pass
   * `[experiment.data_sheets]`.
   */
  extraResetDeps?: unknown[];
  /**
   * Builds the mutation payload from the next plots map. Defaults to sending
   * the whole entity (`{ ...entity, plots }`); analyses send only `{ plots }`.
   */
  buildPayload?: (plots: Record<string, P>) => Partial<T>;
  /** Optional extra query keys to invalidate after a successful mutation. */
  extraInvalidateKeys?: readonly unknown[][];
}

/**
 * Shared CRUD + editor state for the entity-attached plot editors
 * (data tables, experiments, analyses). Handles route syncing, dirty/saving/
 * deleting state and save/delete/revert against `useEditEntityMutation`.
 */
export const usePlotCrud = <
  T extends EntityProperties,
  P extends { id: string },
>({
  entityPath,
  entity,
  getDefaultPlot,
  extraResetDeps = [],
  buildPayload,
  extraInvalidateKeys,
}: UsePlotCrudOptions<T, P>) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { plot_id } = useParams() as { plot_id: string };

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isNew = plot_id === "new";

  const seedPlot = () => entity.plots[plot_id] ?? getDefaultPlot();

  const [plot, setPlot] = useState<P>(seedPlot);

  const nextDeps = [plot_id, entity.plots, ...extraResetDeps];
  const [prevDeps, setPrevDeps] = useState<unknown[]>(nextDeps);
  if (
    prevDeps.length !== nextDeps.length ||
    prevDeps.some((dep, i) => dep !== nextDeps[i])
  ) {
    setPrevDeps(nextDeps);
    setPlot(seedPlot());
  }

  const editEntityMutation = useEditEntityMutation<T>(entityPath, entity.id);

  const persist = async (plots: Record<string, P>) => {
    const payload = buildPayload
      ? buildPayload(plots)
      : ({ ...entity, plots } as Partial<T>);
    await editEntityMutation.mutateAsync(payload);
    if (extraInvalidateKeys?.length) {
      await Promise.all(
        extraInvalidateKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    }
  };

  const onSave = async () => {
    setSaving(true);
    const plotId = isNew ? generateUniqueID() : plot_id;
    const plots = {
      ...entity.plots,
      [plotId]: { ...plot, id: plotId },
    };
    await persist(plots);
    setDirty(false);
    setSaving(false);
    if (isNew) {
      navigate(`../${plotId}`);
    }
  };

  const onDelete = async () => {
    if (
      isNew ||
      !confirm(
        "Are you sure you want to delete this plot? This action is irreversible.",
      )
    )
      return;
    setDeleting(true);
    const plots = { ...entity.plots };
    delete plots[plot_id];
    await persist(plots);
    setDeleting(false);
    setDirty(false);
    navigate(`../${Object.keys(plots)[0] ?? "new"}`);
  };

  const onRevert = () => {
    setDirty(false);
    setPlot(seedPlot());
  };

  return {
    plot,
    setPlot,
    dirty,
    setDirty,
    saving,
    deleting,
    isNew,
    onSave,
    onDelete,
    onRevert,
  };
};
