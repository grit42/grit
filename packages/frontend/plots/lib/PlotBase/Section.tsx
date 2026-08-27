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

import { ReactNode, useState } from "react";
import styles from "./section.module.scss";

const Section = ({
  title,
  defaultOpen = false,
  collapsible = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={styles.section}>
        <div className={styles.heading}>{title}</div>
        <div className={styles.body}>{children}</div>
      </div>
    );
  }

  return (
    <details
      className={styles.section}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
};

export default Section;
