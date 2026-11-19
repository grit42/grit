/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import { createContext, useContext, type ReactNode } from "react";

interface Framed {
  summary: ReactNode;
  guide: ReactNode;
}

const FigureSummaryContext = createContext<Framed>({
  summary: null,
  guide: null,
});

/** A host's data summary and reading guide, drawn in the header row of the figure below it. */
export const FigureSummary = ({
  summary,
  guide = null,
  children,
}: {
  summary: ReactNode;
  /** Behind a `?` beside the notices; a nested frame without one has none. */
  guide?: ReactNode;
  children: ReactNode;
}) => (
  <FigureSummaryContext.Provider value={{ summary, guide }}>
    {children}
  </FigureSummaryContext.Provider>
);

export const useFigureSummary = () => useContext(FigureSummaryContext).summary;

export const useFigureGuide = () => useContext(FigureSummaryContext).guide;
