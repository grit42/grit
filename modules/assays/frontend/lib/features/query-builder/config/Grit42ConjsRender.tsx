/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { ConjsProps } from "@react-awesome-query-builder/ui";
import {
  Button,
  ButtonGroup,
  Checkbox,
} from "@grit42/client-library/components";

/**
 * Renders the AND/OR conjunction toggle and the NOT checkbox using Grit42
 * Button/ButtonGroup/Checkbox primitives. Internal to the query-builder
 * module — wired in via Grit42BasicConfig.settings.renderConjs.
 */
export const Grit42ConjsRender = (props: ConjsProps) => {
  const conjsCount = Object.keys(props.conjunctionOptions ?? []).length;
  const { forceShowConj } = props.config?.settings ?? {};
  const showConj = forceShowConj || (conjsCount > 1 && !props.disabled);

  return (
    <ButtonGroup style={{ zIndex: 1 }}>
      {props.showNot && (
        <Button
          style={{ margin: 0 }}
          size="tiny"
          onClick={() => props.setNot(!props.not)}
          color={props.not ? "secondary" : "primary"}
          variant="filled"
          disabled={props.readonly}
        >
          <div
            style={{
              display: "flex",
              gap: "0.5em",
              alignItems: "center",
            }}
          >
            <Checkbox
              disabled={props.readonly}
              checked={props.not}
              onChange={() => props.setNot(!props.not)}
            ></Checkbox>
            <span>{props.notLabel ?? "Not"}</span>
          </div>
        </Button>
      )}
      {showConj &&
        Object.entries(props.conjunctionOptions ?? {}).map(([key, conj]) => (
          <Button
            style={{ margin: 0 }}
            disabled={props.readonly}
            size="tiny"
            key={key}
            color={conj.checked ? "secondary" : "primary"}
            onClick={() => props.setConjunction(conj.key)}
          >
            {conj.label}
          </Button>
        ))}
    </ButtonGroup>
  );
};
