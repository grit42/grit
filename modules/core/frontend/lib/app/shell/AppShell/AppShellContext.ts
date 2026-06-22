import { createContext, useContext } from "react";

export interface BreadcrumbItem {
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
};

export const AppShellContext =
  createContext<AppShellContextValue>(defaultValue);

export const useAppShell = () => useContext(AppShellContext);
export const useNavbar = () => useContext(AppShellContext).navbar;
export const useBreadcrumbs = () => useContext(AppShellContext).breadcrumbs;
