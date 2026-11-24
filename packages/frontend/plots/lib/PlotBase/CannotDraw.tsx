/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import type { ReactNode } from "react";
import type { PlotNotice } from "../notices";
import { useNoticeStyle } from "./noticeStyle";
import PlotNotices, { NoticeLevelLabel } from "./PlotNotices";
import styles from "./plotNotices.module.scss";

const CannotDraw = ({
  reason,
  notices = [],
  summary,
}: {
  reason: string | readonly string[];
  notices?: readonly PlotNotice[];
  /** Else the frame's, as the figure's own would be. */
  summary?: ReactNode;
}) => {
  const style = useNoticeStyle();
  const reasons = typeof reason === "string" ? [reason] : reason;
  return (
    <div className={styles.stack} style={style}>
      <PlotNotices notices={notices} summary={summary} />
      <div className={styles.cannot} role="status">
        <div>
          <NoticeLevelLabel level="cannot" />
          {reasons.map((one) => (
            <p key={one}>{one}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CannotDraw;
