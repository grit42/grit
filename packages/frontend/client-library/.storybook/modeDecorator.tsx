import React from "react";
import ThemeProvider from "../lib/Theme";
import { StoryContext, StoryFn } from "@storybook/react";

export const ModeDecorator = (Story: StoryFn, context: StoryContext) => (
  <ThemeProvider
    colorScheme={context.globals.colorScheme}
    displayDensity={context.globals.displayDensity}
  >
    <Story />
  </ThemeProvider>
);
