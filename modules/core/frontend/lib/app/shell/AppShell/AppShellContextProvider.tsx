import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import {
  AppShellContext,
  AppShellContextValue,
  BreadcrumbItem,
  HeaderTab,
} from "./AppShellContext";

const AppShellContextProvider = ({ children }: PropsWithChildren) => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const openNavbar = useCallback(
    () => setNavbarOpen(() => true),
    [setNavbarOpen],
  );
  const closeNavbar = useCallback(
    () => setNavbarOpen(() => false),
    [setNavbarOpen],
  );
  const toggleNavbar = useCallback(
    () => setNavbarOpen((prev) => !prev),
    [setNavbarOpen],
  );
  const [breadcrumbsItems, setBreadcrumbsItems] = useState<BreadcrumbItem[][]>(
    [],
  );
  const [tabs, setTabs] = useState<HeaderTab[][]>([]);

  const registerBreadcrumbsItems = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsItems([items]);
    return () => setBreadcrumbsItems([]);
  }, []);

  const registerTabs = useCallback((items: HeaderTab[]) => {
    setTabs((prev) => prev.toSpliced(0, 0, items));
    return () => setTabs((prev) => prev.toSpliced(0, 1));
  }, []);

  const value: AppShellContextValue = useMemo(
    () => ({
      navbar: {
        open: navbarOpen,
        openNavbar,
        closeNavbar,
        toggleNavbar,
      },
      breadcrumbs: {
        items: breadcrumbsItems[0],
        register: registerBreadcrumbsItems,
      },
      tabs: {
        items: tabs[0],
        register: registerTabs,
      },
    }),
    [
      breadcrumbsItems,
      closeNavbar,
      navbarOpen,
      openNavbar,
      registerBreadcrumbsItems,
      registerTabs,
      tabs,
      toggleNavbar,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
};

export default AppShellContextProvider;
