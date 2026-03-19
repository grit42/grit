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

import { classnames } from "@grit42/client-library/utils";
import logo from "../../../assets/grit42-logo.svg";
import hexagonGrid from "../../../assets/login-bg.png";
import styles from "./authenticationPage.module.scss";

interface HexagonProps {
  className?: string;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  stroke: string;
  fill?: string;
}

const Grit42Hexagon = ({
  className,
  width = 444,
  height = 500,
  children,
  stroke,
  fill,
}: HexagonProps) => {
  return (
    <div
      className={classnames(styles.hexagon, className)}
      style={{ width: width + "px", height: height + "px" }}
    >
      <div className={styles.content}>{children}</div>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`-3 0 ${width} ${height}`}
      >
        <path
          stroke={stroke}
          strokeWidth="3px"
          fill={fill ?? "#333333"}
          d={`
            M210.44417311961857
            3.4999999999999996Q216.50635094610965
            0
            222.56852877260073
            3.5L426.95052406572825
            121.5Q433.0127018922193
            125 433.0127018922193
            132L433.0127018922193
            368Q433.0127018922193
            375 426.95052406572825
            378.5L222.56852877260073
            496.5Q216.50635094610965
            500 210.44417311961857
            496.5L6.06217782649107
            378.5Q0 375
            0
            368L0
            132Q0
            125
            6.062177826491071
            121.5Z`}
        />
      </svg>
    </div>
  );
};

const AuthenticationPage = ({
  hasError = false,
  children,
}: {
  hasError?: boolean;
  children: React.ReactElement;
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
