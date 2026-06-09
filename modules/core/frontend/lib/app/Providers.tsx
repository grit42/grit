import { createElement } from "react";
import { useModules } from "./modules";
import { FormInputProvider } from "@grit42/form";
import { ColumnTypeDefProvider } from "@grit42/table";
import { queryClient, QueryClientProvider } from "@grit42/api";
import { ConfirmDialogProvider } from "@grit42/client-library/components";

const Providers = ({ children }: React.PropsWithChildren) => {
  const modules = useModules();

  return (
    <QueryClientProvider client={queryClient}>
      <FormInputProvider>
        <ColumnTypeDefProvider>
          <ConfirmDialogProvider>
            {modules.reduceRight(
              (acc, module) =>
                module.Provider
                  ? createElement(module.Provider, undefined, acc)
                  : acc,
              children,
            )}
          </ConfirmDialogProvider>
        </ColumnTypeDefProvider>
      </FormInputProvider>
    </QueryClientProvider>
  );
};

export default Providers;
