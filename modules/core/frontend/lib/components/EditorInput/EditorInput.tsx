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

import { InputLabel } from "@grit42/client-library/components";
import Editor from "../Editor";
import styles from "./editorInput.module.scss";
import { classnames } from "@grit42/client-library/utils";

interface EditorInputProps {
  onChange: (value: string) => void;
  onBlur: () => void;
  value: string;
  label?: string;
}

const EditorInput = (props: EditorInputProps) => {
  return (
    <div
      className={classnames(styles.container, {
        [styles.withLabel]: !!props.label,
      })}
    >
      {props.label && (
        <InputLabel label={props.label} description="Max. 100 MB" />
      )}
      <Editor {...props} />
    </div>
  );
};

export default EditorInput;
