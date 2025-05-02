import type { Preview } from "@storybook/react";
import { ModeDecorator } from "./modeDecorator";

export const decorators = [ModeDecorator];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    colorScheme: {
      description: "Global color scheme for components",
      toolbar: {
        // The label to show for this toolbar item
        title: "Color scheme",
        icon: "circlehollow",
        // Array of plain string values or MenuItem shape (see below)
        items: ["light", "dark"],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
    displayDensity: {
      description: "Global display density for components",
      toolbar: {
        // The label to show for this toolbar item
        title: "Display density",
        icon: "circlehollow",
        // Array of plain string values or MenuItem shape (see below)
        items: ["comfortable", "compact"],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorScheme: "dark",
    displayDensity: "comfortable",
  },
};

export default preview;
