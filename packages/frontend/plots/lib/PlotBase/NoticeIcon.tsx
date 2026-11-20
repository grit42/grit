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

import type { NoticeLevel } from "../notices";

const PATHS: Record<NoticeLevel | "caret", string[]> = {
  cannot: [
    "M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8Z",
    "M3.7 12.3 12.3 3.7",
  ],
  check: ["M8 1.9 14.6 13.6H1.4Z", "M8 6.3v3.6", "M8 11.9v.1"],
  left: ["M5.2 8h5.6"],
  note: [
    "M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8Z",
    "M8 7.4v4",
    "M8 4.9v.1",
  ],
  caret: ["M4.5 6.5 8 10l3.5-3.5"],
};

/** The level's mark, so it reads without colour. */
const NoticeIcon = ({
  level,
  className,
}: {
  level: NoticeLevel | "caret";
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {level === "left" && (
      <circle cx="8" cy="8" r="6.2" strokeDasharray="2.4 2" />
    )}
    {PATHS[level].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

export default NoticeIcon;
