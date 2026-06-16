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

import { useCallback, useMemo } from "react";
import type {
  BuilderProps,
  Config,
  ImmutableTree,
  JsonTree,
} from "@react-awesome-query-builder/ui";
import {
  Builder,
  Query,
  Utils as QbUtils,
} from "@react-awesome-query-builder/ui";
import "@react-awesome-query-builder/ui/css/styles.css";
import { useTheme } from "@grit42/client-library/hooks";
import { debounce } from "lodash";
import styles from "./Grit42QueryBuilder.module.scss";
import type { QueryBuilderState } from "./useQueryBuilderState";

export interface Grit42QueryBuilderProps {
  /** Current builder state — `{ tree: ImmutableTree, config: Config }`. */
  state: QueryBuilderState;
  /** Setter for the immutable builder tree + config. Debounced writes hit this. */
  setState: React.Dispatch<React.SetStateAction<QueryBuilderState>>;
  /**
   * Optional setter for the persistable JsonTree. Only invoked when the
   * builder reports `QbUtils.isValidTree(tree, config) === true`.
   */
  setTree?: React.Dispatch<React.SetStateAction<JsonTree>>;
  /** Debounce window for the onChange handler. Defaults to 1000ms. */
  debounceMs?: number;
  /** Extra className appended after the theme-mode class on the outer wrapper. */
  className?: string;
}

/**
 * Drop-in Grit42-themed query builder. Owns:
 *   - the @react-awesome-query-builder/ui `<Query>` + `<Builder>` render
 *   - the debounced onChange that propagates tree+config to `setState` and the
 *     persistable JsonTree to `setTree` (when the tree is valid)
 *   - the theme-aware CSS wrapper and the RAQB stylesheet import
 *
 * State management lives outside (typically in `useQueryBuilderState` or a
 * context); this component is a thin renderer.
 */
export const Grit42QueryBuilder = ({
  state,
  setState,
  setTree,
  debounceMs = 1000,
  className,
}: Grit42QueryBuilderProps) => {
  const theme = useTheme();

  const updateResult = useMemo(
    () =>
      debounce((tree: ImmutableTree, config: Config) => {
        setState((prevState) => ({ ...prevState, tree, config }));
        if (setTree && QbUtils.isValidTree(tree, config)) {
          setTree(QbUtils.getTree(tree, false));
        }
      }, debounceMs),
    [setState, setTree, debounceMs],
  );

  const onChange = useCallback(
    (immutableTree: ImmutableTree, config: Config) => {
      updateResult(immutableTree, config);
    },
    [updateResult],
  );

  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div className="query-builder-container" style={{ padding: "10px" }}>
        <div className="query-builder" style={{ overflow: "unset" }}>
          <Builder {...props} />
        </div>
      </div>
    ),
    [],
  );

  const wrapperClassName = [styles[theme.colorScheme], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      <Query
        {...state.config}
        value={state.tree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
    </div>
  );
};
