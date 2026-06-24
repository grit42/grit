import { createContext, useContext, useEffect } from "react";

export interface BreadcrumbItem {
  label: string;
  url: string;
}

export interface HeaderTab {
  label: string;
  url: string;
}

export interface AppShellContextValue {
  navbar: {
    open: boolean;
    openNavbar: () => void;
    closeNavbar: () => void;
    toggleNavbar: () => void;
  };
  breadcrumbs: {
    items: BreadcrumbItem[];
    register: (items: BreadcrumbItem[]) => () => void;
  };
  tabs: {
    items: HeaderTab[];
    register: (tabs: HeaderTab[]) => () => void;
  };
}

const defaultValue: AppShellContextValue = {
  navbar: {
    open: false,
    openNavbar: () => void 0,
    closeNavbar: () => void 0,
    toggleNavbar: () => void 0,
  },
  breadcrumbs: {
    items: [],
    register: () => () => void 0,
  },
  tabs: {
    items: [],
    register: () => () => void 0,
  },
};

export const AppShellContext =
  createContext<AppShellContextValue>(defaultValue);

export const useAppShell = () => useContext(AppShellContext);

export const useBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => {
  const register = useAppShell().breadcrumbs.register;
  useEffect(() => {
    return register(breadcrumbs);
  }, [breadcrumbs, register]);
};

export const useTabs = (tabs: HeaderTab[]) => {
  const register = useAppShell().tabs.register;
  useEffect(() => {
    return register(tabs);
  }, [tabs, register]);
};
