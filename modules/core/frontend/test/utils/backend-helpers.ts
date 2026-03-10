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

import axios from "axios";

const TEST_BACKEND_URL = "http://localhost:3000";
const BACKEND_HEALTH_CHECK_URL = `${TEST_BACKEND_URL}/api/health`;

/**
 * Checks if the test backend is running and throws a helpful error if not
 */
export async function ensureTestBackend(): Promise<void> {
  try {
    await axios.get(BACKEND_HEALTH_CHECK_URL, { timeout: 2000 });
  } catch (error) {
    throw new Error(
      `Test backend is not running. Please start it with:\n\n  pnpm nx serve:test grit-core\n\nError: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Seeds test data using Rails runner
 * This executes Ruby code on the backend to create test data
 */
export async function seedTestData(script: string): Promise<void> {
  // Note: This would need to be implemented as a test-only API endpoint
  // or we could shell out to Rails runner if needed
  // For now, we'll just log a warning
  console.warn(
    "seedTestData is not yet implemented. You may need to manually create test data or implement a test seeding endpoint.",
  );
  console.warn("Script:", script);
}

/**
 * Clears all data from the test database
 * WARNING: Only works in test environment
 */
export async function clearTestDatabase(): Promise<void> {
  try {
    // This would need to be implemented as a test-only API endpoint
    // For now, we assume the db:reset:test task handles this on backend startup
    console.warn(
      "clearTestDatabase is not yet implemented. The test database is reset when serve:test starts.",
    );
  } catch (error) {
    console.error("Failed to clear test database:", error);
    throw error;
  }
}

/**
 * Creates test data for a specific entity via API
 */
export async function createTestEntity(
  entityPath: string,
  data: Record<string, unknown>,
): Promise<{ id: number }> {
  try {
    const response = await axios.post(
      `${TEST_BACKEND_URL}/api/grit/core/entities/${entityPath}`,
      data,
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to create test entity ${entityPath}:`, error);
    throw error;
  }
}

/**
 * Creates multiple test entities for performance testing
 */
export async function seedLargeDataset(
  entityPath: string,
  count: number,
  factory?: (index: number) => Record<string, unknown>,
): Promise<void> {
  console.log(
    `Seeding ${count} ${entityPath} entities for performance testing...`,
  );

  const defaultFactory = (index: number) => ({
    name: `${entityPath}_${index}`,
    description: `Test ${entityPath} number ${index}`,
  });

  const dataFactory = factory || defaultFactory;

  // Create entities in batches to avoid overwhelming the backend
  const BATCH_SIZE = 100;
  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batch = Math.min(BATCH_SIZE, count - i);
    await Promise.all(
      Array.from({ length: batch }, (_, j) =>
        createTestEntity(entityPath, dataFactory(i + j)),
      ),
    );
  }

  console.log(`Seeded ${count} ${entityPath} entities successfully.`);
}
