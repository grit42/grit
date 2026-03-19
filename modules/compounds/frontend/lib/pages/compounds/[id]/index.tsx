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
} from "@grit42/client-library/components";
import { Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useCompound } from "../../../queries/compounds";

const TABS = [
  {
    url: "details",
    label: "Details",
  },
  {
    url: "batches",
    label: "Batches",
  },
  {
    url: "synonyms",
    label: "Synonyms",
  },
];

const CompoundPage = () => {
  const { id } = useParams() as { id: string };

  const {
    data: compound,
    isLoading: isCompoundLoading,
    isError: isCompoundError,
    error: compoundError,
  } = useCompound(id);

  if (!isCompoundLoading && !compound) {
    return <Navigate to="/compounds" />;
  }

  return (
    <RoutedTabs
      matchPattern="/compounds/:id/:childPath/*"
      tabs={TABS}
      navigationPattern="relative-sibling"
      outletWrapper={(outlet) => (
        <Suspense fallback={<Spinner />}>
          {isCompoundLoading && <Spinner />}
          {isCompoundError && <ErrorPage error={compoundError} />}
          {compound && outlet}
        </Suspense>
      )}
    />
  );
};

export default CompoundPage;
