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

import { PropsWithChildren } from "react";
import MarvinIcon from "../../icons/Marvin03Meh";
import styles from "./errorPage.module.scss";

interface ErrorPageProps {
  error?: string | null;
}

const ErrorPage = ({ error, children }: PropsWithChildren<ErrorPageProps>) => {
  return (
    <div className={styles.container}>
      <MarvinIcon className={styles.icon} height={150} />
      <div className={styles.content}>
        <h3>{error ?? "An error occured"}</h3>
        {children}
      </div>
    </div>
  );
};

export default ErrorPage;
