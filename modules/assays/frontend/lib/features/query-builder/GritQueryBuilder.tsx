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

import { useCallback } from "react";
import type {
  BuilderProps,
  Config,
  ImmutableTree,
} from "@react-awesome-query-builder/ui";
import { Builder, Query } from "@react-awesome-query-builder/ui";
import "@react-awesome-query-builder/ui/css/styles.css";
import styles from "./gritQueryBuilder.module.scss";
import type { QueryBuilderState } from "./useQueryBuilderState";
import { classnames } from "@grit42/client-library/utils";

export interface GritQueryBuilderProps {
  state: QueryBuilderState;
  setState: React.Dispatch<React.SetStateAction<QueryBuilderState>>;
  className?: string;
}

export const GritQueryBuilder = ({
  state,
  setState,
}: GritQueryBuilderProps) => {
  const onChange = useCallback(
    (tree: ImmutableTree, config: Config) => {
      setState((prevState) => ({ ...prevState, tree, config }));
    },
    [setState],
  );

  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div
        className={classnames(
          "query-builder-container",
          styles.queryBuilderContainer,
        )}
      >
        <div className="query-builder">
          <Builder {...props} />
        </div>
      </div>
    ),
    [],
  );

  return (
    <Query
      {...state.config}
      value={state.tree}
      onChange={onChange}
      renderBuilder={renderBuilder}
    />
  );
};
