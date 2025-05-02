/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import Grit42Hexagon from "../Grit42Hexagon";
import logo from "../../assets/grit42-logo.svg";
import hexagonGrid from "../../assets/login-bg.png";
import styles from "./authenticationPage.module.scss";

const AuthenticationPage = ({
  hasError = false,
  children,
}: {
  hasError?: boolean;
  children: JSX.Element;
}) => {
  return (
    <div className={styles.authenticationPage}>
      <img className={styles.hexagonGrid} src={hexagonGrid} alt="grit42 logo" />
      <div className={styles.container}>
        <div className={styles.topSpacer} />
        <div className={styles.hexagonContainer}>
          <Grit42Hexagon
            stroke={
              hasError
                ? "var(--palette-warning-main)"
                : "var(--palette-secondary-main)"
            }
          >
            {children}
          </Grit42Hexagon>
        </div>
        <img className={styles.logo} src={logo} alt="Grit42 Logo" />
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
};

export default AuthenticationPage;
