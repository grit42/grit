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

import { useEffect, useRef, useState } from "react";
import type { PlotNotice } from "../notices";
import styles from "./plotNotices.module.scss";

/** How long a notice keeps saying what it changed from. */
const RECENT_MS = 8000;

/**
 * Remembers the previous total so a change can state what it changed from.
 */
const useRecentChange = (total: number) => {
  const [previous, setPrevious] = useState<number | null>(null);
  const last = useRef(total);

  useEffect(() => {
    if (last.current === total) return;
    setPrevious(last.current);
    last.current = total;
    const timer = setTimeout(() => setPrevious(null), RECENT_MS);
    return () => clearTimeout(timer);
  }, [total]);

  return previous;
};

const PlotNotices = ({ notices }: { notices: PlotNotice[] }) => {
  const omitted = notices
    .filter((notice) => notice.kind === "omitted")
    .reduce((sum, notice) => sum + (notice.count ?? 0), 0);
  const previous = useRecentChange(omitted);

  if (!notices.length) return null;

  return (
    <div className={styles.notices} role="status" aria-live="polite">
      {notices.map((notice, index) => (
        <p
          key={`${notice.kind}-${index}`}
          className={notice.kind === "empty" ? styles.empty : styles.omitted}
        >
          {notice.count !== undefined && (
            <b className={styles.count}>{notice.count}</b>
          )}
          <span>{notice.reason}</span>
        </p>
      ))}
      {previous !== null && previous !== omitted && (
        <p className={styles.changed}>
          {omitted > previous
            ? `${omitted - previous} more left out than a moment ago`
            : `${previous - omitted} fewer left out than a moment ago`}
          {previous === 0 && " — nothing was left out before this change"}
        </p>
      )}
    </div>
  );
};

export default PlotNotices;
