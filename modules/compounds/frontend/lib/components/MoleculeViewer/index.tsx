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

import { MolfileSvgRendererProps, MolfileSvgRenderer } from "react-ocl/full";
import { IMoleculeToSVGOptions, Molecule } from "openchemlib/full";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./moleculeViewer.module.scss";
import { Spinner, Dropdown } from "@grit/client-library/components";
import MenuIcon from "@grit/client-library/icons/Menu";
import { lightPalette } from "@grit/client-library/theme";

interface Props {
  id?: string;
  molfile: string;
  height?: number;
  width?: number;
  moleculeToSvgOptions?: IMoleculeToSVGOptions;
}

export const AsyncMoleculeViewer = ({
  id,
  molfile,
  moleculeToSvgOptions,
  width = 300,
  height = 300,
}: Props) => {
  const [molSvg, setMolSvg] = useState<string | null>(null);
  const moleculeRef = useRef<Molecule>();

  const options = useMemo(
    () => ({
      ...moleculeToSvgOptions,
    }),
    [moleculeToSvgOptions],
  );

  useEffect(() => {
    moleculeRef.current = Molecule.fromMolfile(molfile);
    setMolSvg(moleculeRef.current.toSVG(height, width, id, options));
  }, [molfile, height, width, options, id]);

  if (!molfile) return null;
  if (!molSvg)
    return (
      <div className={styles.spinner}>
        <Spinner size={16} />
      </div>
    );

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: lightPalette.background.default }}
    >
      <div
        className={styles.molecule}
        dangerouslySetInnerHTML={{ __html: molSvg }}
      />
      <div
        className={styles.menuContainer}
        id="molecule-viewer-popover-trigger"
      >
        <Dropdown
          menuItems={[
            {
              id: "copy_smiles",
              text: "Copy SMILES to clipboard",
              onClick: async () => {
                await navigator.clipboard.writeText(
                  moleculeRef.current?.toSmiles() ?? "",
                );
                // toast.info("SMILES copied to clipboard!");
              },
            },
            {
              id: "copy_molfile",
              text: "Copy Molfile to clipboard",
              onClick: async () => {
                await navigator.clipboard.writeText(
                  moleculeRef.current?.toMolfile() ?? "",
                );
                // toast.info("Molfile copied to clipboard!");
              },
            },
          ]}
        >
          <MenuIcon height={16} />
        </Dropdown>
      </div>
    </div>
  );
};

interface RefMoleculeViewerProps {
  molecule: Molecule;
  moleculeToSvgOptions?: IMoleculeToSVGOptions;
  height?: number;
  width?: number;
  moleculeContainerClassname?: string;
}

export const RefMoleculeViewer = ({
  molecule,
  moleculeToSvgOptions,
  width = 300,
  height = 300,
  moleculeContainerClassname,
}: RefMoleculeViewerProps) => {
  const [molSvg, setMolSvg] = useState<string | null>(null);

  const options = useMemo(
    () => ({
      autoCrop: true,
      ...moleculeToSvgOptions,
    }),
    [moleculeToSvgOptions],
  );

  useEffect(() => {
    setMolSvg(molecule.toSVG(width, height, molecule.toSmarts(), options));
  }, [molecule, height, width, options]);

  if (!molecule) return null;
  if (!molSvg) return <Spinner size={16} />;

  return (
    <div
      className={moleculeContainerClassname}
      dangerouslySetInnerHTML={{ __html: molSvg }}
    />
  );
};

const MoleculeViewer = (props: MolfileSvgRendererProps) => {
  const { molfile, autoCrop = true, ...rest } = props;
  if (!molfile) return null;
  return (
    <div className={styles.moleculeViewerContainer}>
      {molfile && (
        <MolfileSvgRenderer
          molfile={molfile ?? ""}
          autoCrop={autoCrop}
          {...rest}
        />
      )}
    </div>
  );
};

export default MoleculeViewer;
