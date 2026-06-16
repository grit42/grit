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
import type {
  Config,
  ImmutableTree,
  JsonTree,
} from "@react-awesome-query-builder/ui";
import { safeLoadTree, toValidJsonTree } from "./tree/treeUtils";

export interface QueryBuilderState {
  tree: ImmutableTree;
  config: Config;
}

export interface UseQueryBuilderStateArgs {
  /**
   * Raw initial tree from persistence — anything (null, undefined, an old
   * shape) is safe; toValidJsonTree / safeLoadTree fall back to an empty
   * group.
   */
  initialTree: unknown;
  /** Final RAQB config — produced by buildGrit42Config (or compatible). */
  config: Config;
}

export interface UseQueryBuilderStateReturn {
  /** Persistable JsonTree — sync'd from the immutable tree on valid changes. */
  tree: JsonTree;
  setTree: React.Dispatch<React.SetStateAction<JsonTree>>;
  /** Bundle passed to <Grit42QueryBuilder>. */
  builderState: QueryBuilderState;
  setBuilderState: React.Dispatch<React.SetStateAction<QueryBuilderState>>;
  /** Imperative reload — e.g. after a refetch of the underlying entity. */
  loadFromTree: (next: unknown) => void;
}

/**
 * Owns the dual tree state required by react-awesome-query-builder:
 *   - `builderTree: ImmutableTree` — what the builder UI mutates each keystroke
 *   - `tree: JsonTree` — the persistable serialised form, written only when
 *     the builder reports a valid tree
 *
 * `setBuilderState` accepts the standard React state-action shape but only
 * propagates the `tree` slice; the live `config` is always taken from this
 * hook's args so a single source of truth wins.
 */
export const useQueryBuilderState = ({
  initialTree,
  config,
}: UseQueryBuilderStateArgs): UseQueryBuilderStateReturn => {
  const [tree, setTree] = useState<JsonTree>(() =>
    toValidJsonTree(initialTree),
  );
  const [builderTree, setBuilderTree] = useState<ImmutableTree>(() =>
    safeLoadTree(tree),
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
    const condTree = toValidJsonTree(next);
    setTree(condTree);
    setBuilderTree(safeLoadTree(condTree));
  }, []);

  return {
    tree,
    setTree,
    builderState,
    setBuilderState,
    loadFromTree,
  };
};
