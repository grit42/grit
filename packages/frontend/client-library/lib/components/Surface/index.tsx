/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { classnames } from "../../utils";
import styles from "./surface.module.scss";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number | string | false;
}

export default function Surface({ spacing, ...props }: Props) {
  const padding = useMemo(() => {
    if (typeof spacing === "number") {
      return `calc(var(--spacing) * ${spacing})`;
    }
    return spacing ? spacing : undefined;
  }, [spacing]);

  return (
    <div
      {...props}
      style={{ padding, ...(props.style ?? {}) }}
      className={classnames(styles.surface, props.className)}
    >
      {props.children}
    </div>
  );
}
