import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";
import base from "../../../config/frontend/eslint.config.js";

export default tseslint.config(...base, storybook.configs["flat/recommended"]);
