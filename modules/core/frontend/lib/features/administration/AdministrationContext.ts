import { createContext, useContext } from "react";

export interface AdministrationPage {
    url: string;
    label: string;
    group: string;
    routes: React.ReactNode;
    permissions?: string[]
}

export interface AdministrationContextValue {
    pages: AdministrationPage[];
    authorizedPages: AdministrationPage[];
    register: (pages: AdministrationPage[]) => () => void
}

const defaultValue: AdministrationContextValue = {
    pages: [],
    authorizedPages: [],
    register: () => () => void 0,
}

const AdministrationContext = createContext<AdministrationContextValue>(defaultValue)

export const useAdministrationContext = () => useContext(AdministrationContext)

export default AdministrationContext;
