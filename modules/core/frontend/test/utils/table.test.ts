/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect } from "vitest";
import { getTableColumns, getColumnEntityDef } from "../../lib/utils/table";
import type {
  EntityPropertyDef,
  ForeignEntityPropertyDef,
} from "../../lib/features/entities/types";
import { createEntityProperty } from "../utils/factories";

describe("table utilities", () => {
  describe("getTableColumns", () => {
    it("returns empty array when properties is undefined", () => {
      const columns = getTableColumns(undefined);
      expect(columns).toEqual([]);
    });

    it("returns empty array when properties is empty", () => {
      const columns = getTableColumns([]);
      expect(columns).toEqual([]);
    });

    it("converts entity properties to column definitions", () => {
      const properties: EntityPropertyDef[] = [
        createEntityProperty({
          name: "name",
          display_name: "Name",
          type: "string",
        }),
        createEntityProperty({
          name: "age",
          display_name: "Age",
          type: "integer",
        }),
      ];

      const columns = getTableColumns(properties);

      expect(columns).toHaveLength(2);
      expect(columns[0]).toMatchObject({
        id: "name",
        accessorKey: "name",
        type: "string",
        header: "Name",
      });
      expect(columns[1]).toMatchObject({
        id: "age",
        accessorKey: "age",
        type: "integer",
        header: "Age",
      });
    });

    it("sets default visibility based on default_hidden property", () => {
      const properties: EntityPropertyDef[] = [
        createEntityProperty({ name: "visible", default_hidden: false }),
        createEntityProperty({ name: "hidden", default_hidden: true }),
      ];

      const columns = getTableColumns(properties);

      expect(columns[0]?.defaultVisibility).toBe("visible");
      expect(columns[1]?.defaultVisibility).toBe("hidden");
    });

    it("includes column size from defaultColumnSize", () => {
      const properties: EntityPropertyDef[] = [
        createEntityProperty({
          name: "test",
          defaultColumnSize: 200,
        }),
      ];

      const columns = getTableColumns(properties);
      expect(columns[0]?.size).toBe(200);
    });

    it("includes entity metadata in column meta", () => {
      const entityDef: ForeignEntityPropertyDef = {
        full_name: "Compound",
        name: "compound",
        path: "compounds",
        column: "compound_id",
        display_column: "name",
        display_column_type: "string",
        primary_key: "id",
        primary_key_type: "integer",
      };

      const properties: EntityPropertyDef[] = [
        createEntityProperty({
          name: "compound",
          type: "entity",
          entity: entityDef,
        }),
      ];

      const columns = getTableColumns(properties);
      expect(columns[0]?.meta?.entity).toEqual(entityDef);
    });

    it("includes additional meta properties", () => {
      const properties: EntityPropertyDef[] = [
        createEntityProperty({
          name: "test",
          meta: { custom: "value", flag: true },
        }),
      ];

      const columns = getTableColumns(properties);
      const meta = columns[0]?.meta as any;
      expect(meta?.custom).toBe("value");
      expect(meta?.flag).toBe(true);
    });

    it("handles properties with columnTypeDefs", () => {
      const properties: EntityPropertyDef[] = [
        createEntityProperty({ name: "test", type: "string" }),
      ];

      const columnTypeDefs: any = {
        string: {
          column: {
            filterFn: "includesString",
            enableColumnFilter: true,
          },
          filter: {},
        },
      };

      const columns = getTableColumns(properties, columnTypeDefs);
      expect(columns[0]).toMatchObject({
        filterFn: "includesString",
        enableColumnFilter: true,
      });
    });

    it("performance: handles large number of columns", () => {
      const properties: EntityPropertyDef[] = Array.from(
        { length: 1000 },
        (_, i) =>
          createEntityProperty({
            name: `column_${i}`,
            display_name: `Column ${i}`,
            type: "string",
          }),
      );

      const start = performance.now();
      const columns = getTableColumns(properties);
      const duration = performance.now() - start;

      expect(columns).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe("getColumnEntityDef", () => {
    it("returns entity definition from column meta", () => {
      const entityDef: ForeignEntityPropertyDef = {
        full_name: "Compound",
        name: "compound",
        path: "compounds",
        column: "compound_id",
        display_column: "name",
        display_column_type: "string",
        primary_key: "id",
        primary_key_type: "integer",
      };

      const column: any = {
        id: "compound",
        accessorKey: "compound",
        type: "entity",
        header: "Compound",
        meta: {
          entity: entityDef,
        },
      };

      const result = getColumnEntityDef(column);
      expect(result).toEqual(entityDef);
    });

    it("throws error for non-entity column type", () => {
      const column: any = {
        id: "name",
        accessorKey: "name",
        type: "string",
        header: "Name",
      };

      expect(() => getColumnEntityDef(column)).toThrow(
        "Unsupported type: string",
      );
    });

    it("throws error when entity meta is missing", () => {
      const column: any = {
        id: "compound",
        accessorKey: "compound",
        type: "entity",
        header: "Compound",
        meta: {},
      };

      expect(() => getColumnEntityDef(column)).toThrow(
        "Missing column entity: compound",
      );
    });

    it("throws error when meta is undefined", () => {
      const column: any = {
        id: "compound",
        accessorKey: "compound",
        type: "entity",
        header: "Compound",
      };

      expect(() => getColumnEntityDef(column)).toThrow(
        "Missing column entity: compound",
      );
    });
  });
});
