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

import { CSSProperties, useEffect, useState } from "react";
import styles from "./copyableBlock.module.scss";

interface Props {
  content: string;
  style?: CSSProperties;
}

const CopyableBlock = ({ content }: Props) => {
    const [text, setText] = useState<"Copy" | "Copied!">("Copy");

    const onCopyToClipboard = () => {
      navigator.clipboard.writeText(content);
      setText("Copied!");
    };

    useEffect(() => {
      if (text === "Copied!") {
        const handle = setTimeout(() => setText("Copy"), 1000);
        return () => clearTimeout(handle);
      }
    }, [text]);

    return (
      <div className={styles.container}>
        <div className={styles.copyContainer}>
          <pre className={styles.preContainer}>{content}</pre>
          <div
            className={styles.copyAction}
            onClick={text === "Copy" ? onCopyToClipboard : undefined}
          >
            {text}
          </div>
        </div>

      </div>
    );
  };

export default CopyableBlock;
