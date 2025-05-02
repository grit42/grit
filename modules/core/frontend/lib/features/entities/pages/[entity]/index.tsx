/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useParams } from "react-router-dom";
import { Button, ErrorPage } from "@grit/client-library/components";
import EntityTabs from "./EntityTabs";

const EntityPage = () => {
  const { entity } = useParams();

  if (!entity) {
    return (
      <ErrorPage error="Entity not found">
        <Link to="/">
          <Button>Go to home page</Button>
        </Link>
      </ErrorPage>
    );
  }

  return <EntityTabs entity={entity} />;
};

export default EntityPage;
