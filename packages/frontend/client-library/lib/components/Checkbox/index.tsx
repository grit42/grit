/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { forwardRef, HTMLProps, useEffect, useRef } from "react";
import classnames from "../../utils/classnames";
import styles from "./checkbox.module.scss";
import useCombinedRefs from "../../hooks/useCombinedRefs";

interface Props extends HTMLProps<HTMLInputElement> {
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, Props>(
  ({ indeterminate, className = "", ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null!);

    const combinedRef = useCombinedRefs<HTMLInputElement>(ref, innerRef);

    useEffect(() => {
      if (typeof indeterminate === "boolean" && combinedRef.current) {
        combinedRef.current.indeterminate = !rest.checked && indeterminate;
      }
    }, [combinedRef, indeterminate, rest.checked]);

    return (
      <input
        type="checkbox"
        ref={combinedRef}
        className={classnames(className, styles.checkbox)}
        {...rest}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
