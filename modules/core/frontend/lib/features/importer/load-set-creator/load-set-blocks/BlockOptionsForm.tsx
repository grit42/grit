import {
  FormField,
  FormFieldDef,
  useFormContext,
  useStore,
} from "@grit42/form";
import { CenteredSurface } from "@grit42/client-library/layouts";
import styles from "./loadSetCreator.module.scss";
import { useLoadSetCreatorContext } from "../LoadSetCreatorContext";
import { useImporter } from "../../importer-context/ImportersContext";
import { useMemo } from "react";

const BlockOptionsForm = ({
  blockIndex,
  fields,
}: {
  blockIndex: number;
  fields: FormFieldDef[];
}) => {
  const { entityInfo } = useLoadSetCreatorContext();
  const { refineBlockFields } = useImporter(entityInfo.full_name);
  const form = useFormContext();
  const block = useStore(
    form.baseStore,
    ({ values }) => values.blocks[blockIndex],
  );

  const refinedFields = useMemo(() => {
    const refinedFields = fields.map((f) => ({
      ...f,
      name: `blocks[${blockIndex}].${f.name}`,
    }));
    if (refineBlockFields) return refineBlockFields(block, refinedFields);
    return refinedFields;
  }, [block, blockIndex, fields, refineBlockFields]);

  return (
    <CenteredSurface className={styles.blockOptionsForm}>
      {refinedFields.map((f) => (
        <FormField fieldDef={f} key={f.name} />
      ))}
    </CenteredSurface>
  );
};

export default BlockOptionsForm;
