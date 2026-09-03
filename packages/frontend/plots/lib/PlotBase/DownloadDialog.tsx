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
import type { PlotExportFormat, PlotExportOptions } from "../types";
import {
  buildDownloadRequest,
  DEFAULT_EXPORT_SCALE,
  downloadPlot,
  EXPORT_FORMATS,
  EXPORT_SCALES,
  isRasterFormat,
  suggestedFilename,
} from "./download";
import styles from "./downloadButton.module.scss";

interface DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  graphDiv: HTMLElement | null;
  title: string | undefined;
  options: PlotExportOptions | undefined;
}

const DownloadForm = ({
  onClose,
  graphDiv,
  title,
  options,
}: Omit<DownloadDialogProps, "isOpen">) => {
  const [filename, setFilename] = useState(() =>
    suggestedFilename(options, title),
  );
  const [format, setFormat] = useState<PlotExportFormat>(
    options?.format ?? "svg",
  );
  const [scale, setScale] = useState<number>(
    options?.scale ?? DEFAULT_EXPORT_SCALE,
  );
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDownload = async () => {
    if (!graphDiv) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadPlot(
        graphDiv,
        buildDownloadRequest({ format, filename, scale }),
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the plot");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className={styles.fields}>
        <Input
          type="string"
          label="File name"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
        <fieldset className={styles.formats}>
          <legend>Format</legend>
          {EXPORT_FORMATS.map((option) => (
            <label key={option.value} className={styles.format}>
              <input
                type="radio"
                name="plot-download-format"
                value={option.value}
                checked={format === option.value}
                onChange={() => setFormat(option.value as PlotExportFormat)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
        {isRasterFormat(format) && (
          <fieldset className={`${styles.formats} ${styles.stacked}`}>
            <legend>Resolution</legend>
            {EXPORT_SCALES.map((option) => (
              <label key={option.value} className={styles.format}>
                <input
                  type="radio"
                  name="plot-resolution"
                  value={option.value}
                  checked={scale === option.value}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </div>
      <div className={styles.actions}>
        <Button variant="transparent" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onDownload}
          loading={downloading}
          disabled={!graphDiv || filename.trim().length === 0}
        >
          Download
        </Button>
      </div>
    </>
  );
};

const DownloadDialog = ({ isOpen, ...props }: DownloadDialogProps) => (
  <Dialog isOpen={isOpen} onClose={props.onClose} title="Download plot">
    {isOpen && <DownloadForm {...props} />}
  </Dialog>
);

export default DownloadDialog;
