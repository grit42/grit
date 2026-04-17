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

import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import * as monaco from "monaco-editor";
import styles from "./editor.module.scss";

const Editor = ({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) => {
  const theme = useTheme();
  const editorRef = useRef<any>(null);
  const listenersRef = useRef<monaco.IDisposable[]>([]);
  const handleEditorMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      editor.setValue(value);

      if (onBlur) {
        listenersRef.current = [
          editor.onDidBlurEditorText(onBlur),
          editor.onDidBlurEditorWidget(onBlur),
        ];
      }
    },
    [onBlur, value],
  );

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    return () =>
      listenersRef.current?.forEach((listener) => listener.dispose());
  }, []);

  return (
    <div className={styles.container}>
      <MonacoEditor
        height="100%"
        width="100%"
        theme={theme.colorScheme === "dark" ? "vs-dark" : "vs"}
        options={{
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
          scrollBeyondLastColumn: 15,
          scrollBeyondLastLine: false,
        }}
        loading={null}
        onMount={handleEditorMount}
        onChange={(v) => {
          onChange(v ?? "");
        }}
      />
    </div>
  );
};

export default Editor;
