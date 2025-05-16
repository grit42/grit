import { Surface } from "@grit42/client-library/components";
import { useMemo } from "react";
import { AssayData, useAssayFields } from "../../../queries/assays";
import styles from "../assays.module.scss";

const AssayDetails = ({ assay }: { assay: AssayData }) => {
  const { data: assayFields } = useAssayFields(
    { assay_id: assay.id.toString() },
    {
      select: (data) =>
        data.filter(({ metadata_definition_id }) => !!metadata_definition_id),
    },
  );

  const metadata = useMemo(
    () =>
      assayFields?.map((f) => ({
        key: f.name,
        label: f.display_name,
        value:
          assay[
            (f as any).entity
              ? `${f.name}__${(f as any).entity.display_column}`
              : f.name
          ] as string,
      })),
    [assay, assayFields],
  );

  return (
    <Surface className={styles.details}>
      <em>Assay model</em>
      <h3>{assay.assay_model_id__name}</h3>
      <em>Assay type</em>
      <h3>{assay.assay_type_id__name}</h3>
      <em>Metadata</em>
      {metadata?.length && (
        <div
          style={{ display: "flex", gap: "var(--spacing)", flexWrap: "wrap" }}
        >
          {metadata.map((m) => (
            <span
              key={m.key}
              style={{
                backgroundColor: "rgb(from var(--palette-info-main) r g b / 0.5)",
                padding: "calc(var(--spacing) / 2)",
                borderRadius: "var(--border-radius)",
                textWrap: "nowrap",
              }}
            >
              <strong>
                {m.label}: {m.value}
              </strong>
            </span>
          ))}
        </div>
      )}
    </Surface>
  );
};

export default AssayDetails;
