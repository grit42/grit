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

import { Button, ButtonGroup } from "@grit42/client-library/components";
import { useForm } from "@tanstack/react-form";
import { Form, FormFieldDef } from "@grit42/form";
import { Fragment, useMemo } from "react";
import { LoadSetData, LoadSetMapping } from "../../../types";
import MappingFormFieldGroup from "./MappingFormFieldGroup";
import styles from "./loadSet.module.scss";

const MappingForm = ({
  loadSet,
  entityFields,
  headers,
  mappings,
  onSubmit,
  onIgnoreError,
  onCancel,
}: {
  loadSet: LoadSetData;
  entityFields: FormFieldDef[];
  headers: Array<string | null>;
  mappings: Record<string, LoadSetMapping>;
  onSubmit: (mappings: Record<string, LoadSetMapping>) => Promise<void>;
  onIgnoreError: () => Promise<void>;
  onCancel: () => Promise<void>;
}) => {
  const headerOptions = useMemo(
    () =>
      headers
        .filter((h) => h !== null)
        .map((c, i) => ({ value: i.toString(), label: c })),
    [headers],
  );

  const defaultValues = useMemo(
    () =>
      entityFields.reduce((acc, f) => {
        return {
          ...acc,
          [`${f.name}-header`]: mappings[f.name]?.header ?? "",
          [`${f.name}-constant`]: mappings[f.name]?.constant ?? false,
          [`${f.name}-find_by`]: mappings[f.name]?.find_by ?? "",
          [`${f.name}-value`]: mappings[f.name]?.value ?? null,
        };
      }, {}),
    [mappings, entityFields],
  );

  const form = useForm<Record<string, string | number | boolean | null>>({
    onSubmit: async ({ value }) => {
      const newMappings: Record<string, LoadSetMapping> = {};
      for (const key in value) {
        const sep = key.lastIndexOf("-");
        const field = key.slice(0, sep);
        const mappingProp = key.slice(sep + 1);
        newMappings[field] = {
          ...(newMappings[field] ?? {}),
          [mappingProp]: value[key],
        };
      }

      await onSubmit(newMappings);
    },
    defaultValues,
  });

  return (
    <Form form={form} className={styles.mappingForm}>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div
            style={{
              padding: "calc(var(--spacing) * 2)",
            }}
          >
            <ButtonGroup>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
              >
                Continue
              </Button>
              {(loadSet.status_id__name === "Invalidated") && (
                <Button color="danger" onClick={onIgnoreError}>Ignore errors and confirm</Button>
              )}
              <Button onClick={onCancel}>Cancel</Button>
            </ButtonGroup>
          </div>
        )}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing)",
          overflowY: "auto",
          paddingInline: "calc(var(--spacing) * 2)",
          paddingBottom: "calc(var(--spacing) * 2)",
        }}
      >
        {entityFields.map((field) => (
          <Fragment key={field.name}>
            <MappingFormFieldGroup
              entityField={field}
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
      </div>
    </Form>
  );
};

export default MappingForm;
