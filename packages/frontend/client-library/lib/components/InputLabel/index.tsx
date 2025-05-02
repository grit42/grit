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

import classnames from "../../utils/classnames";
import styles from "./inputlabel.module.scss";

const InputLabel = ({
  label,
  description,
}: {
  label: string;
  description?: string;
}) => {
  return (
    <div className={classnames(styles.label)}>
      <label htmlFor={label}>{label}</label>
      {description && <p>{description}</p>}
    </div>
  );
};

export default InputLabel;
