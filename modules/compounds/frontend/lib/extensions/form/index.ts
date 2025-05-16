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

import { useEffect } from "react";
import { useRegisterFormInput } from "@grit42/form";
import MolInput from "./MolInput";

const useRegisterCompoundInputs = () => {
  const registerFormInput = useRegisterFormInput();

  useEffect(() => {
    const unregisterMol = registerFormInput("mol", MolInput);

    return () => {
      unregisterMol();
    };
  }, [registerFormInput]);
};

export default useRegisterCompoundInputs;
