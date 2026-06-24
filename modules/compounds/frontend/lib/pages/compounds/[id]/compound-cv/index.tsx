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

import { useState } from "react";
import {
  Button,
  ErrorPage,
  Spinner,
  Tooltip,
} from "@grit42/client-library/components";
import { SidebarLayout } from "@grit42/client-library/layouts";
import { useTheme } from "@grit42/client-library/hooks";
import ToggleForwardIcon from "@grit42/client-library/icons/Circle2Toggleforward";
import ToggleBackwardIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import { useParams } from "react-router-dom";
import { useCompound, useCompoundFields } from "../../../../queries/compounds";
import styles from "./compoundCv.module.scss";
import CompoundCVInfoSidebar from "./CompoundCVInfo";
import { CompoundCVResultsTable } from "./CompoundCVResultsTable";

const CompoundCV = () => {
  const { id } = useParams() as { id: string };
  const { data: compound } = useCompound(id);
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  if (!compound) {
    return null;
  }

  const toggleButton = (
    <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
      <Button
        variant="transparent"
        color="secondary"
        size="tiny"
        onClick={() => setCollapsed((previous) => !previous)}
        icon={
          collapsed ? (
            <ToggleForwardIcon
              width={26}
              height={26}
              fill={theme.palette.secondary.main}
            />
          ) : (
            <ToggleBackwardIcon
              width={26}
              height={26}
              fill={theme.palette.secondary.main}
            />
          )
        }
      />
    </Tooltip>
  );

  const sidebar = collapsed ? (
    <div className={styles.collapsedStrip}>{toggleButton}</div>
  ) : (
    <CompoundCVInfoSidebar compound={compound} toggleButton={toggleButton} />
  );

  return (
    <SidebarLayout sidebar={sidebar}>
      <div className={styles.resultsPanel}>
        <CompoundCVResultsTable compound={compound} />
      </div>
    </SidebarLayout>
  );
};

const CompoundCVPage = () => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields();

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return <CompoundCV />;
};

export default CompoundCVPage;
