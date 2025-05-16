/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  ColorScheme,
  DisplayDensity,
  PaletteBackground,
  PaletteColor,
} from "../../theme/types";
import ThemeContext, { createTheme } from "../../theme";

function kebabize(str: string) {
  return str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase(),
  );
}

function getThemeVariables(
  theme: Record<string, PaletteColor | PaletteBackground | string>,
  prefix: string,
): string[] {
  return Object.keys(theme).flatMap((key) => {
    if (typeof theme[key] === "object")
      return getThemeVariables(theme[key], `${prefix}-${kebabize(key)}`);
    else return `${prefix}-${kebabize(key)}: ${theme[key]};`;
  });
}

const ThemeProvider = ({
  colorScheme = "dark",
  displayDensity = "comfortable",
  children,
}: {
  colorScheme?: ColorScheme;
  displayDensity?: DisplayDensity;
  children: React.ReactNode;
}) => {
  const theme = useMemo(
    () => createTheme(colorScheme, displayDensity),
    [colorScheme, displayDensity],
  );

  const themeStyles = useMemo(() => {
    const props = getThemeVariables(theme.palette, "--palette");
    props.push(`--spacing: ${theme.spacing}px;`);
    props.push(`color-scheme: ${colorScheme};`);
    props.push(`--color-scheme: ${colorScheme};`);
    props.push("--border-radius: 6px;");
    props.push("--body-font-family: sintony, sans-serif;");
    props.push("--title-font-family: guardian, georgia, serif;");
    props.push("--box-shadow: 0 3px 7px 0 rgba(0, 0, 0, 0.3);");
    return props.join("\n");
  }, [theme, colorScheme]);

  return (
    <>
      <Helmet>
        <style type="text/css">{`
            :root {
              ${themeStyles}
            }

            html {
              background-color: var(--palette-background-default);
              color: var(--palette-background-contrast-text);
            }
         `}</style>
      </Helmet>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </>
  );
};

export default ThemeProvider;
