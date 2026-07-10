import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import AdministrationContext, {
  AdministrationPage,
} from "./AdministrationContext";
import { hasOneOfPermissions, useSession } from "../auth";

const AdministrationContextProvider = ({ children }: PropsWithChildren) => {
  const { data: session = null } = useSession();
  const [pages, setPages] = useState<AdministrationPage[]>([]);
  const register = useCallback((pages: AdministrationPage[]) => {
    setPages((prev) => [...prev, ...pages]);
    return () => {
      setPages((prev) => prev.filter((p) => !pages.includes(p)));
    };
  }, []);

  const value = useMemo(
    () => ({
      pages,
      register,
      authorizedPages: pages.filter(({ permissions = [] }) =>
        hasOneOfPermissions(session, permissions),
      ),
    }),
    [pages, register, session],
  );

  return (
    <AdministrationContext.Provider value={value}>
      {children}
    </AdministrationContext.Provider>
  );
};

export default AdministrationContextProvider;
