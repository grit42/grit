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

import { useState } from "react";
import { Input } from "@grit42/client-library/components";

/**
 * A numeric field that survives partial input.
 *
 * Committing straight to the model loses a lone `-`:
 * it does not parse, so it becomes `undefined`,
 * Holding the raw text until it parses is what makes the minus sign usable.
 */
const NumberField = ({
  label,
  value,
  placeholder,
  description,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  onCommit: (value: number | undefined) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      type="number"
      label={label}
      placeholder={placeholder}
      description={description}
      min={min}
      max={max}
      value={draft ?? value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const parsed = Number(raw);
        if (raw.trim() === "" || !Number.isFinite(parsed)) {
          onCommit(undefined);
          return;
        }
        onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed)));
      }}
      // Drop the draft so the field falls back to what was actually stored.
      onBlur={() => setDraft(null)}
    />
  );
};

export default NumberField;
