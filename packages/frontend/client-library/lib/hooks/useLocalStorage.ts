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

import superjson from "superjson";
import { useCallback, useRef, useState } from "react";
import useEventCallback from "./useEventCallback";
import useEventListener from "./useEventListener";

declare global {
  interface WindowEventMap {
    "local-storage": CustomEvent;
  }
}

export function readLocalStorageValue<T = null>(key: string, fallbackValue: T) {
  // No window during a server-side build.
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (superjson.parse(item) as T) : fallbackValue;
  } catch (error) {
    console.warn("Error reading localStorage key:", key, error);
    return fallbackValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  fallbackValue: T,
  shareState?: boolean,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    return readLocalStorageValue<T>(key, fallbackValue);
  }, [fallbackValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Read by the setter, so two functional updates in one handler compose.
  const latest = useRef<T>(storedValue);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useEventCallback(
    (value: React.SetStateAction<T>) => {
      if (typeof window == "undefined") {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`,
        );
        return fallbackValue;
      }

      try {
        const newValue =
          value instanceof Function ? value(latest.current) : value;

        latest.current = newValue;
        setStoredValue(newValue);

        window.localStorage.setItem(key, superjson.stringify(newValue));

        // Notifies the other hooks in this tab.
        if (shareState !== false) {
          window.dispatchEvent(new Event("local-storage"));
        }
      } catch (error) {
        console.warn("Error setting localStorage key:", key, error);
      }
    },
  );

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent)?.key && (event as StorageEvent).key !== key) {
        return;
      }
      const next = readValue();
      latest.current = next;
      setStoredValue(next);
    },
    [key, readValue],
  );

  // `storage` fires in other tabs only; `local-storage` covers this one.
  useEventListener("storage", handleStorageChange);
  useEventListener("local-storage", handleStorageChange);

  return [storedValue, setValue];
}

export function useLocalStorageChanges<T>(
  id: string,
  callback?: (value: T | null) => void,
) {
  const handleStorageChange = (event: StorageEvent | CustomEvent) => {
    if ((event as StorageEvent)?.key && (event as StorageEvent).key !== id) {
      return;
    }

    if (callback) callback(readLocalStorageValue<T | null>(id, null));
  };

  // As in useLocalStorage: other tabs, then this one.
  useEventListener("storage", handleStorageChange);
  useEventListener("local-storage", handleStorageChange);
}
