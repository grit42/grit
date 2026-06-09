import { createElement } from "react";
import { useModules } from "./modules";

const Registrants = () => {
  const modules = useModules();

  return modules.map((module, index) =>
    module.Registrant ? createElement(module.Registrant, { key: index }) : null,
  );
};

export default Registrants;
