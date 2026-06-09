import { AnyFormApi, FormFieldDef } from "@grit42/form";
import { SidebarLayout } from "@grit42/client-library/layouts";
import BlockOptionsForm from "./BlockOptionsForm";
import BlockPreview from "./BlockPreview";

const BlockForm = ({
  blockIndex,
  form,
  fields,
}: {
  blockIndex: number;
  form: AnyFormApi;
  fields: FormFieldDef[];
}) => {
  return (
    <SidebarLayout
      sidebar={<BlockOptionsForm blockIndex={blockIndex} fields={fields} />}
    >
      <BlockPreview blockIndex={blockIndex} form={form} />
    </SidebarLayout>
  );
};

export default BlockForm;
