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

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  NAMED_ITEMS,
  NOTICE_LEVEL_LABELS,
  leftOutCount,
  noticeLevel,
  noticeText,
  sortedNotices,
  type NoticeLevel,
  type PlotNotice,
} from "../notices";
import { useFigureGuide, useFigureSummary } from "./FigureSummary";
import NoticeIcon from "./NoticeIcon";
import { useNoticeStyle } from "./noticeStyle";
import styles from "./plotNotices.module.scss";

/** How long the chip keeps saying what changed. */
const RECENT_MS = 8000;

/** The previous total, held for RECENT_MS after a change. */
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

export const NoticeLevelLabel = ({ level }: { level: NoticeLevel }) => (
  <span className={styles.level} data-level={level}>
    <NoticeIcon level={level} />
    {NOTICE_LEVEL_LABELS[level]}
  </span>
);

const NoticeRow = ({ notice }: { notice: PlotNotice }) => {
  const [all, setAll] = useState(false);
  const items = notice.items?.length ?? 0;
  return (
    <tr>
      <td>
        <NoticeLevelLabel level={noticeLevel(notice)} />
      </td>
      <td>
        {noticeText(notice, all ? items : NAMED_ITEMS)}
        {items > NAMED_ITEMS && (
          <>
            {" "}
            <button
              type="button"
              className={styles.more}
              aria-expanded={all}
              onClick={() => setAll(!all)}
            >
              {all ? "show fewer" : `show all ${items}`}
            </button>
          </>
        )}
      </td>
      <td className={styles.count}>{notice.count ?? "–"}</td>
    </tr>
  );
};

const plural = (count: number) => `${count} notice${count === 1 ? "" : "s"}`;

/** The figure's header row: summary, notices chip and reading guide. */
const PlotNotices = ({
  notices,
  summary: own,
}: {
  notices: readonly PlotNotice[];
  /** Else the frame's (`FigureSummary`); `null` for none. */
  summary?: ReactNode;
}) => {
  const framed = useFigureSummary();
  const guide = useFigureGuide();
  const summary = own === undefined ? framed : own;
  const [shown, setShown] = useState<"notices" | "guide" | null>(null);
  const open = shown === "notices";
  const id = useId();
  const guideId = useId();
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const help = useRef<HTMLButtonElement>(null);
  const style = useNoticeStyle();
  const leftOut = leftOutCount(notices);
  const previous = useRecentChange(leftOut);

  useEffect(() => {
    if (!shown) return;
    const outside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setShown(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShown(null);
      (shown === "guide" ? help : chip).current?.focus();
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [shown]);

  if (!notices.length && !summary && !guide) return null;

  const sorted = sortedNotices(notices);
  const top = sorted[0] && noticeLevel(sorted[0]);
  const change = previous === null ? 0 : leftOut - previous;

  return (
    <div ref={root} className={styles.header} style={style}>
      <div className={styles.row}>
        {summary ? <div className={styles.summary}>{summary}</div> : null}
        {(top || guide) && (
          <div className={styles.end}>
            {top && (
              <span role="status">
                <button
                  ref={chip}
                  type="button"
                  className={styles.chip}
                  data-level={top}
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={() => setShown(open ? null : "notices")}
                >
                  <NoticeIcon level={top} />
                  {plural(notices.length)}
                  <span className={styles.hidden}>
                    , most serious: {NOTICE_LEVEL_LABELS[top]}
                  </span>
                  {change !== 0 && (
                    <span className={styles.change}>
                      {change > 0 ? `+${change}` : `−${-change}`} left out
                    </span>
                  )}
                  <NoticeIcon level="caret" className={styles.caret} />
                </button>
              </span>
            )}
            {guide && (
              <button
                ref={help}
                type="button"
                className={styles.help}
                aria-label="How to read this"
                title="How to read this"
                aria-expanded={shown === "guide"}
                aria-controls={guideId}
                onClick={() => setShown(shown === "guide" ? null : "guide")}
              >
                ?
              </button>
            )}
          </div>
        )}
        {shown === "guide" && guide && (
          <div
            id={guideId}
            className={`${styles.table} ${styles.guide}`}
            role="region"
            aria-label="How to read this"
          >
            {guide}
          </div>
        )}
        {open && top && (
          <div
            id={id}
            className={styles.table}
            role="region"
            aria-label="Notices"
          >
            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Notice</th>
                  <th className={styles.count}>Count</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((notice, index) => (
                  <NoticeRow
                    key={`${index}-${notice.reason}`}
                    notice={notice}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlotNotices;
