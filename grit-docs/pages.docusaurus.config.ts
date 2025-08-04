import type { Config } from "@docusaurus/types";

import baseConfig from "./docusaurus.config";

const config: Config = {
  ...baseConfig,
  url: "https://grit42.github.io",
  baseUrl: "/grit",
  organizationName: "grit42",
  projectName: "grit",
  deploymentBranch: "gh-pages",
};

export default config;
