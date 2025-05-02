import { FormInputProvider } from "@grit/form";
import { ColumnTypeDefProvider } from "@grit/table";
import { Provider as CoreProvider } from "@grit/core";

const Provider = ({ children }: React.PropsWithChildren) => (
  <FormInputProvider>
    <ColumnTypeDefProvider>
      <CoreProvider>{children}</CoreProvider>
    </ColumnTypeDefProvider>
  </FormInputProvider>
);

export default Provider;
