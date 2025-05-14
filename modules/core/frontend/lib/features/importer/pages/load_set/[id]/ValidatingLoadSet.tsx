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

import { Surface } from "@grit42/client-library/components";
import { LoadSetData } from "../../../types";
import { useEffect } from "react";
import { useEntityDatum } from "../../../../entities";

const ValidatingLoadSet = ({ loadSet }: { loadSet: LoadSetData }) => {
  const { refetch } = useEntityDatum<LoadSetData>(
    "grit/core/load_sets",
    loadSet.id.toString(),
  );

  useEffect(() => {
    const interval = setInterval(() => refetch({ cancelRefetch: false }), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <Surface>
      <p>The data set is being validated, hold tight...</p>
    </Surface>
  );
};

export default ValidatingLoadSet;
