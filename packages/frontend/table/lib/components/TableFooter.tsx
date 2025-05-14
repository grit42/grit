/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./table.module.scss";

const TableFooter = ({ loadedRecords, totalRecords }: { loadedRecords?: number, totalRecords?: number }) => {
  let message = "";
  if (totalRecords !== undefined && loadedRecords !== undefined && totalRecords !== loadedRecords) {
    message = `Showing ${loadedRecords} out of ${totalRecords} records`;
  } else if (loadedRecords !== undefined) {
    message = `${loadedRecords} records`;
  }
  return <div className={styles.footer}>{message}</div>;
};

export default TableFooter;
