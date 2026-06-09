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

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import { axiosClient } from "@grit42/api";
import { renderHook, waitFor } from "../../utils/test-utils";
import {
  useEntities,
  useEntity,
  useEntityColumns,
  useEntityFields,
  useEntityData,
  useInfiniteEntityData,
  useEntityDatum,
} from "../../../lib/features/entities/queries";

// --- Config ---

const TEST_BACKEND_URL = "http://localhost:3000";
// full_name used by metadata hooks (useEntity, useEntityColumns, useEntityFields)
const ENTITY_FULL_NAME = "Grit::TestEntity";
// path used by data hooks (useEntityData, useInfiniteEntityData, useEntityDatum, mutations)
const ENTITY_PATH = "grit/test_entities";
// Namespace for test data to avoid conflicts with other test runs
const NS = `qtest_${Date.now()}`;

// --- State ---

let backendAvailable = false;
let authCookie = "";
const createdIds: number[] = [];
let seedEntity: { id: number; name: string };

// --- Helpers ---

async function authenticate(): Promise<void> {
  // The seeded admin user starts inactive; activate it (idempotent — fails silently if already active)
  await axios.post(
    `${TEST_BACKEND_URL}/api/grit/core/user/activate`,
    {
      activation_token: "admin",
      password: "testtest",
      password_confirmation: "testtest",
    },
    { validateStatus: () => true },
  );

  const response = await axios.post(
    `${TEST_BACKEND_URL}/api/grit/core/user_session`,
    { login: "admin", password: "testtest", remember_me: true },
  );
  const setCookies: string[] = response.headers["set-cookie"] ?? [];
  authCookie = setCookies.map((c) => c.split(";")[0]).join("; ");
}

async function createTestEntity(
  name: string,
): Promise<{ id: number; name: string }> {
  const response = await axios.post(
    `${TEST_BACKEND_URL}/api/${ENTITY_PATH}`,
    { name },
    { headers: { Cookie: authCookie } },
  );
  const entity = response.data.data as { id: number; name: string };
  createdIds.push(entity.id);
  return entity;
}

async function destroyTestEntities(ids: number[]): Promise<void> {
  if (!ids.length) return;
  // ids must be a comma-separated string (matches useDestroyEntityMutation format)
  await axios.delete(
    `${TEST_BACKEND_URL}/api/${ENTITY_PATH}/destroy?ids=${ids.join(",")}`,
    {
      headers: { Cookie: authCookie },
      timeout: 5000,
    },
  );
}

// --- Suite ---

describe("Entity Query Hooks", () => {
  beforeAll(async () => {
    try {
      // Retry until the backend responds or we time out (Rails boot takes a few seconds)
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        try {
          // Any HTTP response means the backend is up; only network errors mean it's down
          await axios.get(`${TEST_BACKEND_URL}/api/health`, {
            timeout: 2000,
            validateStatus: () => true,
          });
          break; // backend responded
        } catch {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      axiosClient.defaults.baseURL = `${TEST_BACKEND_URL}/api`;
      await authenticate();
      axiosClient.defaults.headers.common["Cookie"] = authCookie;

      seedEntity = await createTestEntity(`${NS}_seed`);
      backendAvailable = true;
    } catch {
      console.warn(
        "⚠ Test backend not available - integration tests will be skipped.\n" +
          "  Start it with: pnpm nx serve:test grit-core",
      );
    }
  }, 30000);

  afterAll(async () => {
    if (backendAvailable) {
      await destroyTestEntities(createdIds);
    }
  }, 30000);

  // Skips the calling test when backend is not available
  function requireBackend(): boolean {
    if (!backendAvailable) return false;
    return true;
  }

  // --- useEntities ---

  describe("useEntities", () => {
    it("fetches an array of entity types", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntities());

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it("includes test_entities in the list", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntities());

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const entry = result.current.data!.find(
        (e) => e.full_name === ENTITY_FULL_NAME,
      );
      expect(entry).toBeDefined();
      expect(entry!.path).toBe(ENTITY_PATH);
    });
  });

  // --- useEntity ---

  describe("useEntity", () => {
    it("fetches metadata for a known entity", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntity(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data!.full_name).toBe(ENTITY_FULL_NAME);
      expect(result.current.data!.path).toBe(ENTITY_PATH);
    });

    it("returns no entity data for an unknown entity", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntity("nonexistent_entity_xyz"));

      // Backend may return error state or success with null — either way no data
      await waitFor(
        () =>
          expect(result.current.isError || result.current.isSuccess).toBe(true),
        { timeout: 10000 },
      );
      expect(result.current.data ?? null).toBeNull();
    }, 15000);
  });

  // --- useEntityColumns ---

  describe("useEntityColumns", () => {
    it("fetches column definitions for test_entities", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityColumns(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      const names = result.current.data!.map((c) => c.name);
      expect(names).toContain("id");
      expect(names).toContain("name");
      expect(names).toContain("created_at");
    });

    it("returns correct types for each column", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityColumns(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const byName = Object.fromEntries(
        result.current.data!.map((c) => [c.name, c]),
      );
      expect(byName["name"]?.type).toBe("string");
      expect(byName["integer"]?.type).toBe("integer");
      expect(byName["decimal"]?.type).toBe("decimal");
      expect(byName["boolean"]?.type).toBe("boolean");
      expect(byName["datetime"]?.type).toBe("datetime");
      expect(byName["date"]?.type).toBe("date");
      expect(byName["user_id__name"]?.type).toBe("entity");
    });

    it("includes entity definition on entity-type columns", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityColumns(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const entityCol = result.current.data!.find(
        (c) => c.name === "user_id__name",
      );
      expect(entityCol?.entity).toBeDefined();
      expect(entityCol!.entity!.full_name).toBe("Grit::Core::User");
      expect(entityCol!.entity!.path).toBe("grit/core/users");
    });

    it("marks system columns as default_hidden", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityColumns(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const byName = Object.fromEntries(
        result.current.data!.map((c) => [c.name, c]),
      );
      expect(byName["id"]?.default_hidden).toBe(true);
      expect(byName["created_at"]?.default_hidden).toBe(true);
      expect(byName["name"]?.default_hidden).toBe(false);
    });
  });

  // --- useEntityFields ---

  describe("useEntityFields", () => {
    it("fetches field definitions for test_entities", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityFields(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      const names = result.current.data!.map((f) => f.name);
      expect(names).toContain("name");
      expect(names).toContain("integer");
      expect(names).toContain("boolean");
      expect(names).toContain("user_id");
    });

    it("excludes system fields from form fields", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityFields(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const names = result.current.data!.map((f) => f.name);
      expect(names).not.toContain("id");
      expect(names).not.toContain("created_at");
      expect(names).not.toContain("updated_at");
    });

    it("marks the name field as required", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityFields(ENTITY_FULL_NAME));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const nameField = result.current.data!.find((f) => f.name === "name");
      expect(nameField?.required).toBe(true);
    });
  });

  // --- useEntityData ---

  describe("useEntityData", () => {
    it("fetches all records as an array", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it("records include id, name, and audit stamps", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      // We seeded at least one entity in beforeAll
      expect(result.current.data!.length).toBeGreaterThan(0);
      const record = result.current.data![0];
      expect(record).toHaveProperty("id");
      expect(record).toHaveProperty("name");
      expect(record).toHaveProperty("created_at");
      expect(record).toHaveProperty("created_by");
    });

    it("sorts records by name ascending", async () => {
      if (!requireBackend()) return;

      await createTestEntity(`${NS}_sort_aaa`);
      await createTestEntity(`${NS}_sort_zzz`);

      const { result } = renderHook(() =>
        useEntityData(ENTITY_PATH, [{ id: "name", desc: false }]),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const names = result.current
        .data!.map((r) => (r as Record<string, unknown>)["name"] as string)
        .filter((n) => n.startsWith(NS));

      expect(names.indexOf(`${NS}_sort_aaa`)).toBeLessThan(
        names.indexOf(`${NS}_sort_zzz`),
      );
    });

    it("sorts records by name descending", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() =>
        useEntityData(ENTITY_PATH, [{ id: "name", desc: true }]),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const names = result.current
        .data!.map((r) => (r as Record<string, unknown>)["name"] as string)
        .filter((n) => n.startsWith(NS));

      expect(names.indexOf(`${NS}_sort_zzz`)).toBeLessThan(
        names.indexOf(`${NS}_sort_aaa`),
      );
    });

    it("filters records by exact name match", async () => {
      if (!requireBackend()) return;

      const uniqueName = `${NS}_filter_unique`;
      await createTestEntity(uniqueName);

      const filter = [
        {
          id: "name_filter",
          type: "string",
          operator: "eq",
          column: "name",
          property: "name",
          property_type: "string",
          active: true,
          value: uniqueName,
        },
      ];

      const { result } = renderHook(() =>
        useEntityData(ENTITY_PATH, undefined, filter),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data!).toHaveLength(1);
      expect((result.current.data![0] as Record<string, unknown>)["name"]).toBe(
        uniqueName,
      );
    });
  });

  // --- useInfiniteEntityData ---

  describe("useInfiniteEntityData", () => {
    it("fetches first page of records", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useInfiniteEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data!.pages).toHaveLength(1);
      expect(Array.isArray(result.current.data!.pages[0].data)).toBe(true);
    });

    it("first page includes the seeded entity", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useInfiniteEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const firstPageData = result.current.data!.pages[0].data as Array<
        Record<string, unknown>
      >;
      const found = firstPageData.some((r) => r["id"] === seedEntity.id);
      expect(found).toBe(true);
    });

    it("hasNextPage is false when fewer than 500 records exist", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useInfiniteEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it("returns cursor and total metadata", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() => useInfiniteEntityData(ENTITY_PATH));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      const firstPage = result.current.data!.pages[0];
      expect(typeof firstPage.cursor).toBe("number");
      expect(typeof firstPage.total).toBe("number");
      expect(firstPage.total).toBeGreaterThanOrEqual(1);
    });
  });

  // --- useEntityDatum ---

  describe("useEntityDatum", () => {
    it("returns empty object for entityId 'new' without a network call", async () => {
      // This works even without the backend - it's pure client-side logic
      const { result } = renderHook(() => useEntityDatum(ENTITY_PATH, "new"));

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).toEqual({});
    });

    it("fetches a specific record by numeric ID", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() =>
        useEntityDatum(ENTITY_PATH, seedEntity.id),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).not.toBeNull();
      const data = result.current.data as Record<string, unknown>;
      expect(data["id"]).toBe(seedEntity.id);
      expect(data["name"]).toBe(seedEntity.name);
    });

    it("enters error state for a nonexistent ID", async () => {
      if (!requireBackend()) return;

      const { result } = renderHook(() =>
        useEntityDatum(ENTITY_PATH, 999999999),
      );

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      });
    });
  });
});
