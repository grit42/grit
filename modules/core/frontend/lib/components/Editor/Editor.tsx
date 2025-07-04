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

import { Button, Surface } from "@grit42/client-library/components";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import * as monaco from "monaco-editor";
import { toast } from "@grit42/notifications";

const Editor = ({
  value,
  onChange,
  onBlur,
  showInitialOverlay,
  showFilePicker,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  showInitialOverlay?: boolean;
  showFilePicker?: boolean;
}) => {
  const theme = useTheme();
  const [overlayVisible, setOverlayVisible] = useState(
    showInitialOverlay ?? value === "",
  );
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<any>(null);
  const listenersRef = useRef<monaco.IDisposable[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    return () =>
      listenersRef.current?.forEach((listener) => listener.dispose());
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
    >
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
          setOverlayVisible(v === "");
        }}
      />
      {(isDragging || overlayVisible) && (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            setIsDragging(false);
            event.preventDefault();
            event.stopPropagation();

            const file = event.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();

              reader.onload = (event) => {
                const raw = event.target?.result;
                const fileContent =
                  typeof raw === "string"
                    ? raw
                    : new TextDecoder().decode(raw as ArrayBuffer);
                editorRef.current?.setValue(fileContent);
                if (onBlur) {
                  onBlur();
                }
              };

              reader.onerror = () => {
                toast.error("Could not read the dropped file.");
              };

              reader.readAsText(file);
            } else {
              toast.error("Could not read the dropped file.");
            }
          }}
          style={{
            visibility: overlayVisible ? undefined : "hidden",
            height: "100%",
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: "4px solid",
            borderColor: isDragging ? "var(--palette-secondary-main)" : "#0000",
            borderRadius: "var(--border-radius)",
            zIndex: 10,
            backgroundColor: "#0005",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing)",
          }}
          onClick={() => {
            setOverlayVisible(false);
            editorRef.current?.focus();
          }}
        >
          <Surface
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--spacing)",
            }}
          >
            <p>Drop or pick a file, or click anywhere to start typing</p>
            <Button
              key="file-picker-button"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Pick a file
            </Button>
          </Surface>
        </div>
      )}
      {!overlayVisible && showFilePicker && (
        <Button
          key="file-picker-button"
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{
            position: "absolute",
            bottom: "var(--spacing)",
            right: "calc(var(--spacing) * 3 )",
            zIndex: 10,
          }}
        >
          Pick a file
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        onClick={(e) => e.stopPropagation()}
        onChange={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const file = event.target.files?.[0];
          if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
              const raw = event.target?.result;
              const fileContent =
                typeof raw === "string"
                  ? raw
                  : new TextDecoder().decode(raw as ArrayBuffer);
              setOverlayVisible(false);
              editorRef.current?.setValue(fileContent);
              editorRef.current?.focus();
              if (onBlur) {
                onBlur();
              }
            };

            reader.onerror = () => {
              toast.error("Could not read the selected file.");
            };

            reader.readAsText(file);
          } else {
            toast.error("Could not read the selected file.");
          }
        }}
        style={{ display: "none", height: 0, width: 0 }}
      />
    </div>
  );
};

export default Editor;
