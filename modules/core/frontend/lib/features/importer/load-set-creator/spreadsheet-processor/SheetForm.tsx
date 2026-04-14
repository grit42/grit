import { AnyFormApi } from "@grit42/form";
import { SidebarLayout } from "@grit42/client-library/layouts";
import SheetOptionsForm from "./SheetOptionsForm";
import SheetPreview from "./SheetPreview";

const SheetForm = ({
  sheetIndex,
  form,
}: {
  sheetIndex: number;
  form: AnyFormApi;
}) => {
  return (
    <SidebarLayout
      sidebar={<SheetOptionsForm sheetIndex={sheetIndex} form={form} />}
    >
      <SheetPreview sheetIndex={sheetIndex} form={form} />
    </SidebarLayout>
  );
};

export default SheetForm;
