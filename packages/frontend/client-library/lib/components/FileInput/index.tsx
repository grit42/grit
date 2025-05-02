/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DropzoneProps as ReactDropZoneProps,
  useDropzone,
  FileWithPath,
} from "react-dropzone";
import classNames from "../../utils/classnames";
import DeleteIcon from "../../icons/Delete";
import InputLabel from "../InputLabel";
import styles from "./fileInput.module.scss";

interface Props {
  className?: string;
  containerClassName?: string;
  onDrop?: (acceptedFiles: File[]) => void;
  label?: string;
  description?: string;
  initialFiles?: File[];
  overrideFiles?: File[];
}

type ExtraProps = Props & Omit<ReactDropZoneProps, "onDrop">;

export type DropzoneProps = Pick<
  ExtraProps,
  "accept" | "multiple" | "className" | "containerClassName" | "maxSize"
>;

const FileInput = ({
  className,
  onDrop,
  label,
  description,
  initialFiles,
  overrideFiles,
  ...props
}: ExtraProps) => {
  const [files, setFiles] = useState<FileWithPath[]>(
    overrideFiles ?? initialFiles ?? [],
  );

  useEffect(() => {
    setFiles(overrideFiles ?? []);
  }, [overrideFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...props,
    onDrop(acceptedFiles) {
      addFiles(acceptedFiles);
    },
  });

  const addFiles = useCallback(
    (newFiles: FileWithPath[]) => {
      const newFileList = props.multiple
        ? [
            ...files,
            ...newFiles.filter(
              (x) => files.find((y) => y.path === x.path) === undefined,
            ),
          ]
        : newFiles;

      setFiles(newFileList);
      if (onDrop) onDrop(newFileList);
    },
    [files, setFiles, onDrop, props.multiple],
  );

  const removeFile = useCallback(
    (file: FileWithPath) => {
      const newFileList = files.filter((x) => x.path !== file.path);

      setFiles(newFileList);
      if (onDrop) onDrop(newFileList);
    },
    [files, setFiles, onDrop],
  );

  return (
    <div
      className={classNames(styles.dropzoneContainer, props.containerClassName)}
    >
      {label && label.trim() !== "" && (
        <InputLabel label={label} description={description} />
      )}

      <div
        {...getRootProps({
          className: classNames(styles.dropzone, className, {
            [styles.focused as string]: isDragActive,
          }),
          onDrop: (e) => {
            e.preventDefault();
          },
        })}
      >
        <input {...getInputProps()} />
        <p>Drag and drop, or click to select files</p>
      </div>

      <div className={styles.files}>
        {files.map((file) => {
          return (
            <div key={file.path ?? file.name} className={styles.file}>
              <p>{file.name}</p>
              <DeleteIcon
                className={styles.icon}
                height={12}
                onClick={() => {
                  removeFile(file);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileInput;
