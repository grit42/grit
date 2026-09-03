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

import { useState } from "react";
import { Button, Dialog, Input } from "@grit42/client-library/components";
import type { PlotAnnotation } from "../types";
import styles from "./annotationLayer.module.scss";

export interface AnnotationPoint {
  x: number | string;
  y: number | string;
  axis?: string;
}

/** Adding a note to a figure. */
const AnnotationLayer = ({
  annotating,
  onAnnotatingChange,
  pending,
  onCancel,
  onCommit,
}: {
  annotating: boolean;
  onAnnotatingChange: (annotating: boolean) => void;
  /** The point that was clicked, once there is one. */
  pending: AnnotationPoint | null;
  onCancel: () => void;
  onCommit: (text: string) => void;
}) => {
  const [text, setText] = useState("");

  const close = () => {
    setText("");
    onCancel();
  };

  return (
    <>
      <Button
        size="tiny"
        variant={"filled"}
        aria-pressed={annotating}
        onClick={() => onAnnotatingChange(!annotating)}
      >
        {annotating ? "Click the plot" : "Add note"}
      </Button>
      <Dialog isOpen={pending !== null} onClose={close} title="Add a note">
        {pending !== null && (
          <div className={styles.form}>
            <span className={styles.at}>
              At {String(pending.x)}, {String(pending.y)}
            </span>
            <Input
              type="string"
              label="Note"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  onCommit(text.trim());
                  setText("");
                }
              }}
            />
            <div className={styles.actions}>
              <Button variant="transparent" onClick={close}>
                Cancel
              </Button>
              <Button
                disabled={!text.trim()}
                onClick={() => {
                  onCommit(text.trim());
                  setText("");
                }}
              >
                Add note
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default AnnotationLayer;

/** The list of notes, for the settings panel. */
export const AnnotationList = ({
  annotations,
  onDelete,
}: {
  annotations: PlotAnnotation[];
  onDelete: (id: string) => void;
}) => {
  if (!annotations.length)
    return (
      <span className={styles.none}>
        No notes yet. Use “Add note” above the figure, then click where the note
        belongs.
      </span>
    );

  return (
    <ul className={styles.list}>
      {annotations.map((annotation) => (
        <li key={annotation.id}>
          <div className={styles.entry}>
            <span className={styles.text}>{annotation.text}</span>
            <span className={styles.meta}>
              at {String(annotation.x)}, {String(annotation.y)}
              {annotation.author ? ` — ${annotation.author}` : ""}
            </span>
          </div>
          <Button
            size="tiny"
            variant="transparent"
            aria-label={`Delete note: ${annotation.text}`}
            onClick={() => onDelete(annotation.id)}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
};
