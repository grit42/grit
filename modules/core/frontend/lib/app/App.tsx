import "./index.scss";
import Providers from "./Providers";
import Registrants from "./Registrants";
import Router from "./Router";
import { GritModule, ModulesContext } from "./modules";
import { NavItem } from "./navigation";

interface AppProps {
  modules: GritModule[];
  navItems?: NavItem[];
}

const App = ({ modules, navItems }: AppProps) => {
  return (
    <ModulesContext.Provider value={{ modules, navItems: navItems ?? null }}>
      <Providers>
        <Registrants />
        <title>grit</title>
        <Router />
      </Providers>
    </ModulesContext.Provider>
  );
};

export default App;
