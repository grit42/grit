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
import { FormApi, FormFieldDef } from "@grit42/form";
import { Fragment, useMemo } from "react";
import MappingFieldGroup from "./MappingFieldGroup";
import styles from "./loadSetEditor.module.scss";

const MappingFields = ({
  disabled,
  form,
  entityFields,
  headers,
}: {
  disabled: boolean;
  form: FormApi<any>;
  entityFields: FormFieldDef[];
  headers: { name: string; display_name: string | null }[];
}) => {
  const headerOptions = useMemo(() => {
    return headers
      .filter(({ display_name }) => display_name !== null)
      .map(({ name, display_name }) => ({
        value: name,
        label: display_name ?? name,
      }));
  }, [headers]);

  return (
    <Surface className={styles.mappingFieldsContainer}>
      {entityFields.map((field) => (
        <Fragment key={field.name}>
          <MappingFieldGroup
            entityField={field}
            disabled={disabled}
            form={form}
            headerOptions={headerOptions}
          />
          <div className={styles.mappingFieldDivider}></div>
        </Fragment>
      ))}
    </Surface>
  );
};

export default MappingFields;
