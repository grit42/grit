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
import { ReactFormExtendedApi } from "@grit42/form";
import { FormFieldDef } from "@grit42/form";
import { Fragment, useMemo } from "react";
import MappingFieldGroup from "./MappingFieldGroup";

const MappingFields = ({
  disabled,
  form,
  entityFields,
  headers,
}: {
  disabled: boolean;
  form: ReactFormExtendedApi<
    Record<string, string | number | boolean | null>,
    undefined
  >;
  entityFields: FormFieldDef[];
  headers: Array<string | null>;
}) => {
  const headerOptions = useMemo(() => {
    const nonEmptyHeaders = headers
      .map((header, index) => ({ header, originalIndex: index }))
      .filter(({ header }) => header !== null) as {
      header: string;
      originalIndex: number;
    }[];
    return nonEmptyHeaders.map(({ header, originalIndex }) => ({
      value: originalIndex.toString(),
      label: header,
    }));
  }, [headers]);

  return (
    <Surface
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing)",
        overflowY: "auto",
        paddingInline: "calc(var(--spacing) * 2)",
        paddingBottom: "200px",
      }}
    >
      {entityFields.map((field) => (
        <Fragment key={field.name}>
          <MappingFieldGroup
            entityField={field}
            disabled={disabled}
            form={form}
            headerOptions={headerOptions}
          />
          <div
            style={{
              width: "100%",
              borderBottom: "1px solid",
              borderColor:
                "rgb(from var(--palette-primary-contrast-text) r g b / 50%)",
              marginBlock: "var(--spacing)",
            }}
          ></div>
        </Fragment>
      ))}
    </Surface>
  );
};

export default MappingFields;
