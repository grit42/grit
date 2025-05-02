/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useRef, useState } from "react";
import styles from "./moleculeInput.module.scss";
import { RefMoleculeViewer } from "../MoleculeViewer";
import MoleculeEditor from "../MoleculeEditor";
import { Molecule, SmilesParser } from "openchemlib/full";
import Circle1CloseIcon from "@grit/client-library/icons/Circle1Close";
import EditIcon from "@grit/client-library/icons/Edit";
import { classnames } from "@grit/client-library/utils";
import {
  Dialog,
  InputError,
  InputLabel,
} from "@grit/client-library/components";
import { lightPalette } from "@grit/client-library/theme";

interface StandardProps {
  className?: string;
  inputClassName?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  name?: string;
  error?: string;
  description?: string;
  onChange: (mol: string | null) => void;
  isClearable?: boolean;
  filter?: boolean;
  substructure?: boolean;
  height?: number;
}

export const getMoleculeFromValue = (
  substructure: boolean,
  filter: boolean,
  value?: string,
) => {
  const molecule = new Molecule(256, 256);
  molecule.setFragment(substructure);
  if (!value || value === "") {
    return molecule;
  } else if (filter) {
    const smilesParser = new SmilesParser({
      smartsMode: substructure ? "smarts" : "smiles",
    });

    smilesParser.parseMolecule(value, {
      molecule,
    });
    return molecule;
  }
  return Molecule.fromMolfile(value);
};

const MoleculeInput = ({
  className,
  label,
  onChange,
  value,
  disabled,
  error,
  description,
  inputClassName,
  isClearable = false,
  filter = false,
  substructure = false,
  height = 30,
}: StandardProps) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [toggled, setToggled] = useState(false);
  const moleculeRef = useRef<Molecule>(
    getMoleculeFromValue(substructure, filter, value),
  );

  const onClear = () => {
    if (!isClearable) return;
    if (onChange) onChange(null);
  };

  useEffect(() => {
    moleculeRef.current = getMoleculeFromValue(substructure, filter, value);
  }, [substructure, filter, value]);

  const iconContainer = (
    <div className={styles.iconContainer}>
      {!disabled && isClearable && value && (
        <Circle1CloseIcon
          height={14}
          className={styles.clearIcon}
          style={{ color: lightPalette.background.contrastText }}
          onClick={(e) => {
            if (disabled) return;
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
        />
      )}

      <EditIcon
        height={14}
        className={styles.icon}
        style={{ color: lightPalette.background.contrastText }}
        onClick={() => {
          if (disabled) return;
          setToggled(true);
        }}
      />
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter") {
      setToggled(true);
    }

    if (e.key === "Tab") {
      setToggled(false);
    }
  };

  return (
    <div className={classnames(styles.mol, className)}>
      {label && <InputLabel description={description} label={label} />}

      <div
        className={classnames(styles.fieldContainer, inputClassName, {
          [styles.disabled as string]: disabled === true,
        })}
        style={{
          height: height + 8,
          backgroundColor: lightPalette.background.default,
        }}
        ref={fieldRef}
        tabIndex={!disabled ? 0 : undefined}
        onFocus={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <div
          className={styles.field}
          onClick={() => {
            if (disabled) return;

            setToggled(true);
          }}
        >
          <RefMoleculeViewer
            width={100}
            height={height}
            molecule={moleculeRef.current}
            moleculeToSvgOptions={{ autoCrop: true }}
            moleculeContainerClassname={styles.molecule}
          />
        </div>

        {iconContainer}
      </div>
      <InputError error={error} />

      <Dialog
        isOpen={toggled}
        onClose={() => setToggled(false)}
        isFullscreen
        withTable
        canOutsideClickClose={false}
        title={`S${substructure ? "ubs" : ""}tructure editor`}
      >
        <div className={styles.dialog}>
          <MoleculeEditor
            fragment={substructure}
            molecule={moleculeRef.current}
            onDone={(molecule) => {
              if (molecule.getMolweight() > 0) {
                onChange(
                  filter
                    ? substructure
                      ? molecule.toSmarts()
                      : molecule.toSmiles()
                    : molecule.toMolfile(),
                );
              } else {
                onChange(null);
              }
              setToggled(false);
            }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default MoleculeInput;
