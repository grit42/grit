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

import {
  ErrorPage,
  Spinner,
  RoutedTabs,
  LoadingPage,
} from "@grit42/client-library/components";
import { Suspense, useMemo } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { CompoundData, useCompound } from "../../../queries/compounds";
import { useCompoundBreadcrumbs } from "./breadcrumbs";
import { useTabs } from "@grit42/core";
import styles from "./compound.module.scss";

const TABS = (compound?: CompoundData | null) =>
  compound
    ? [
        {
          url: `/compounds/${compound.id}/details`,
          label: "Details",
        },
        {
          url: `/compounds/${compound.id}/batches`,
          label: "Batches",
        },
        {
          url: `/compounds/${compound.id}/synonyms`,
          label: "Synonyms",
        },
      ]
    : [];

const CompoundPage = () => {
  const { id } = useParams() as { id: string };

  const {
    data: compound,
    isLoading: isCompoundLoading,
    isError: isCompoundError,
    error: compoundError,
  } = useCompound(id);
  useCompoundBreadcrumbs(compound);
  useTabs(useMemo(() => TABS(compound), [compound]));

  if (isCompoundLoading) {
    return <LoadingPage />;
  }

  if (isCompoundError || !compound) {
    return (
      <ErrorPage error={compoundError}>
        <Link to="/compounds">Back</Link>
      </ErrorPage>
    );
  }

  return (
    <Suspense fallback={<LoadingPage />}>
      <div className={styles.compoundPage}>
        <Outlet />
      </div>
    </Suspense>
  );
};

export default CompoundPage;
