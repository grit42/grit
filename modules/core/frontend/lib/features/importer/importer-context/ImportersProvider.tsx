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

import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import ImportersContext, { ImporterDef } from "./ImportersContext";
import { genericGuessLoadSetBlockValues } from "../utils/load_set_blocks";
import { dsvSampleData } from "../load-set-creator/load-set-blocks/utils";

const DEFAULT_IMPORTER: ImporterDef = {
  guessLoadSetBlockValues: genericGuessLoadSetBlockValues,
  LoadSetBlockViewerExtraActions: () => null,
  sampleData: dsvSampleData,
};

const ImportersProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [importers, setImporters] = useState<Record<string, ImporterDef>>({
    default: DEFAULT_IMPORTER,
  });
  const register = useCallback(
    (type: string, importer: Partial<ImporterDef>) => {
      setImporters((prev) => ({
        ...prev,
        [type]: { ...DEFAULT_IMPORTER, ...importer },
      }));
      return () =>
        setImporters((prev) => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
    },
    [],
  );

  const value = useMemo(() => ({ importers, register }), [importers, register]);

  return (
    <ImportersContext.Provider value={value}>
      {children}
    </ImportersContext.Provider>
  );
};

export default ImportersProvider;
