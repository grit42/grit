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

import styles from "./loadSetBlockEditor.module.scss";
import { FormFieldDef } from "@grit42/form";

const LoadSetBlockInfoHints = ({
  unsetFields,
  unusedHeaders,
}: {
  unsetFields: FormFieldDef[];
  unusedHeaders: { display_name: string | null; name: string }[];
}) => {
  if (unusedHeaders.length === 0 && unsetFields.length === 0) return null;
  return (
    <div className={styles.loadSetBlockInfoSummary}>
      {unsetFields.length > 0 && (
        <div className={styles.loadSetBlockInfoSummarySection}>
          <span className={styles.loadSetBlockInfoSummaryLabel}>
            Unset fields
          </span>
          <span>{unsetFields.map((f) => f.display_name).join(", ")}</span>
        </div>
      )}
      {unusedHeaders.length > 0 && (
        <div className={styles.loadSetBlockInfoSummarySection}>
          <span className={styles.loadSetBlockInfoSummaryLabel}>
            Unused headers
          </span>
          <span>
            {unusedHeaders
              .map(({ name, display_name }) => display_name ?? name)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
};

export default LoadSetBlockInfoHints;
