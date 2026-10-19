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

import { useCallback, useMemo, useState } from "react";
import {
  Utils,
  type Config,
  type ImmutableTree,
  type JsonTree,
} from "@react-awesome-query-builder/ui";
import { isEqual } from "lodash";
import { safeLoadTree } from "./tree/treeUtils";

export interface QueryBuilderState {
  tree: ImmutableTree;
  config: Config;
}

export interface UseQueryBuilderStateArgs {
  initialTree: unknown;
  config: Config;
}

export interface UseQueryBuilderStateReturn {
  builderState: QueryBuilderState;
  setBuilderState: React.Dispatch<React.SetStateAction<QueryBuilderState>>;
  persistableTree: JsonTree;
  isDirty: boolean;
  loadFromTree: (next: unknown) => void;
}

export const useQueryBuilderState = ({
  initialTree,
  config,
}: UseQueryBuilderStateArgs): UseQueryBuilderStateReturn => {
  const [builderTree, setBuilderTree] = useState<ImmutableTree>(() =>
    safeLoadTree(initialTree),
  );

  const builderState = useMemo<QueryBuilderState>(
    () => ({ tree: builderTree, config }),
    [builderTree, config],
  );

  const setBuilderState = useCallback<
    React.Dispatch<React.SetStateAction<QueryBuilderState>>
  >(
    (action) => {
      setBuilderTree((prev) => {
        const next =
          typeof action === "function"
            ? action({ tree: prev, config })
            : action;
        return next.tree;
      });
    },
    [config],
  );

  const loadFromTree = useCallback((next: unknown) => {
    setBuilderTree(safeLoadTree(next));
  }, []);

  const { persistableTree, isDirty } = useMemo(() => {
    const persistableTree = Utils.getTree(builderState.tree, false);
    const isDirty = !isEqual(initialTree, persistableTree);
    return { persistableTree, isDirty };
  }, [builderState.tree, initialTree]);

  return {
    builderState,
    setBuilderState,
    persistableTree,
    isDirty,
    loadFromTree,
  };
};
