/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Molecule, SmilesParser } from "openchemlib/full";
import { StructureEditor } from "react-ocl/full";
import styles from "./moleculeEditor.module.scss";
import { useMemo, useRef, useState } from "react";
import { useDebounceCallback, useResizeObserver } from "usehooks-ts";
import { classnames } from "@grit42/client-library/utils";
import { Button, Input, Surface } from "@grit42/client-library/components";
import { lightPalette } from "@grit42/client-library/theme";

interface Props {
  molecule: Molecule;
  onDone: (molecule: Molecule) => void;
  fragment?: boolean;
}

const MoleculeEditor = ({ molecule, onDone, fragment = false }: Props) => {
  const moleculeRef = useRef<Molecule>(molecule);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [initialMolfile, setInitialMolfile] = useState<string>(
    moleculeRef.current.toMolfile(),
  );
  const [molfile, setMolfile] = useState<string>(
    moleculeRef.current.getMolweight() > 0 ? initialMolfile : "",
  );
  const [smiles, setSmiles] = useState<string>(
    fragment ? moleculeRef.current.toSmarts() : moleculeRef.current.toSmiles(),
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const editorKey = useMemo(() => Date.now().toString(), [initialMolfile]);

  const [{ width, height }, setSize] = useState<{
    width?: number;
    height?: number;
  }>({
    width: undefined,
    height: undefined,
  });

  const onResize = useDebounceCallback(({ width, height }) => {
    setSize((prev) => {
      if (!buttonContainerRef.current) return prev;
      const { height: buttonContainerHeight } =
        buttonContainerRef.current.getBoundingClientRect();
      if (!height || !width) return prev;
      const molfile = moleculeRef.current.toMolfile();
      setInitialMolfile(molfile);
      setMolfile(moleculeRef.current.getMolweight() > 0 ? molfile : "");
      setSmiles(
        fragment
          ? moleculeRef.current.toSmarts()
          : moleculeRef.current.toSmiles(),
      );
      return {
        height: Math.floor(height - buttonContainerHeight),
        width: Math.floor(width * 0.7),
      };
    });
  }, 200);

  useResizeObserver({
    ref: containerRef,
    onResize,
    box: "border-box",
  });

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        className={styles.editorContainer}
        style={{ backgroundColor: lightPalette.background.surface }}
      >
        {height && width && (
          <StructureEditor
            key={editorKey}
            height={height}
            width={width}
            svgMenu
            initialMolfile={initialMolfile}
            onChange={(_, changedMolecule) => {
              moleculeRef.current = changedMolecule;
              setMolfile(
                moleculeRef.current.getMolweight() > 0
                  ? moleculeRef.current.toMolfile()
                  : "",
              );
              setSmiles(
                fragment
                  ? moleculeRef.current.toSmarts()
                  : moleculeRef.current.toSmiles(),
              );
            }}
            fragment={fragment}
          />
        )}
      </div>
      <div className={classnames(styles.inputContainer, styles.molfile)}>
        <Surface style={{ display: "flex", flex: 1 }}>
          <Input
            type="textarea"
            label="Molfile"
            value={molfile}
            wrapperClassName={styles.input}
            className={styles.input}
            fieldClassName={styles.input}
            onFocus={(e: any) => e.target.select()}
            onChange={(e: any) => {
              let molecule = new Molecule(256, 256);
              if (e.target.value && e.target.value !== "") {
                molecule = Molecule.fromMolfile(e.target.value);
              }
              molecule.setFragment(fragment);
              moleculeRef.current = molecule;
              setInitialMolfile(e.target.value);
              setMolfile(e.target.value);
              setSmiles(
                fragment
                  ? moleculeRef.current.toSmarts()
                  : moleculeRef.current.toSmiles(),
              );
            }}
          />
        </Surface>
      </div>
      <div className={classnames(styles.inputContainer, styles.smiles)}>
        <Surface style={{ display: "flex", flex: 1 }}>
          <Input
            type="textarea"
            wrapperClassName={styles.input}
            className={styles.input}
            fieldClassName={styles.input}
            label={fragment ? "SMARTS" : "SMILES"}
            value={smiles}
            onFocus={(e: any) => e.target.select()}
            onChange={(e: any) => {
              const molecule = new Molecule(256, 256);
              molecule.setFragment(fragment);
              if (e.target.value && e.target.value !== "") {
                const smilesParser = new SmilesParser({
                  smartsMode: fragment ? "smarts" : "smiles",
                });
                smilesParser.parseMolecule(e.target.value, {
                  molecule,
                });
              }
              moleculeRef.current = molecule;
              setInitialMolfile(molecule.toMolfile());
              setMolfile(
                molecule.getMolweight() > 0 ? molecule.toMolfile() : "",
              );
              setSmiles(e.target.value);
            }}
          />
        </Surface>
      </div>
      <div ref={buttonContainerRef} className={styles.buttonContainer}>
        <Button
          onClick={() => {
            onDone(moleculeRef.current);
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default MoleculeEditor;
