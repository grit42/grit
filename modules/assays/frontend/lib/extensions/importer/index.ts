/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect } from "react";
import { useRegisterImporter } from "@grit42/core";
import NewLoadSet from "./experiment-data-sheet-record/NewLoadSet";
import SucceededLoadSetWrapper from "./experiment-data-sheet-record/SucceededLoadSet";

const useRegisterExperimentDataSheetRecordImporter = () => {
  const registerImporter = useRegisterImporter();

  useEffect(() => {
    const unregisterExperimentDataSheetRecordImporter = registerImporter("Grit::Assays::ExperimentDataSheetRecord", {
        LoadSetCreator: NewLoadSet,
        SucceededLoadSet: SucceededLoadSetWrapper,
    });

    return () => {
        unregisterExperimentDataSheetRecordImporter();
    };
  }, [registerImporter]);

  return null;
};

export default useRegisterExperimentDataSheetRecordImporter;
