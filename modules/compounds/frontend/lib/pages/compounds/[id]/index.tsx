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

import { ErrorPage, Spinner, Tabs } from "@grit42/client-library/components";
import { Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
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
  {
    url: "Compound-cv",
    label: "Compound CV",
  }
];

const CompoundPage = () => {
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };

  const {
    data: compound,
    isLoading: isCompoundLoading,
    isError: isCompoundError,
    error: compoundError,
  } = useCompound(id);

  const match = useMatch("/compounds/:id/:childPath/*");
  const childPath = match?.params.childPath ?? "details";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => childPath === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => childPath === url));
  }, [childPath]);

  const handleTabChange = (index: number) => {
    navigate(TABS[index].url);
  };

  if (!isCompoundLoading && !compound) {
    return <Navigate to="/compounds" />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Suspense fallback={<Spinner />}>
        {isCompoundLoading && <Spinner />}
        {isCompoundError && (
          <ErrorPage error={compoundError} />
        )}
        {compound && <Outlet />}
      </Suspense>
    </div>
  );
};

export default CompoundPage;
