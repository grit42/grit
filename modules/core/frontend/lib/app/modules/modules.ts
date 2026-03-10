import { createContext, useContext } from "react";
import { NavItem } from "../navigation";

export interface ModuleMeta {
  identifier: string;
  rootRoute: string;
  navItems: NavItem[];
}

export interface GritModule {
  Meta: ModuleMeta;
  Router: React.LazyExoticComponent<() => React.ReactElement>;
  Registrant?: React.FunctionComponent;
  Provider?: React.FunctionComponent;
}

interface ModulesContextValue {
  modules: GritModule[];
  navItems: NavItem[] | null;
}

export const ModulesContext = createContext<ModulesContextValue>({
  modules: [],
  navItems: null,
});

export const useModules = () => useContext(ModulesContext).modules;
export const useNavItems = () => {
  const { modules, navItems } = useContext(ModulesContext);
  return navItems ?? modules.flatMap(({ Meta }) => Meta.navItems);
};
