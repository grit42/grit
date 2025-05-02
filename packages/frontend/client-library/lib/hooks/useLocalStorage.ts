/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import superjson from "superjson";
import { useCallback, useEffect, useState } from "react";
import useEventCallback from "./useEventCallback";
import useEventListener from "./useEventListener";

declare global {
  interface WindowEventMap {
    "local-storage": CustomEvent;
  }
}

function readLocalStorageValue<T = null>(key: string, fallbackValue: T) {
  // Prevent build error "window is undefined" but keeps working
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (superjson.parse(item) as T) : fallbackValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return fallbackValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  fallbackValue: T,
  shareState?: boolean,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get from local storage then
  // parse stored json or return fallbackValue
  const readValue = useCallback((): T => {
    return readLocalStorageValue<T>(key, fallbackValue);
  }, [fallbackValue, key]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: React.Dispatch<React.SetStateAction<T>> = useEventCallback(
    (value: React.SetStateAction<T>) => {
      // Prevent build error "window is undefined" but keeps working
      if (typeof window == "undefined") {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`,
        );
        return fallbackValue;
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(newValue);

        // Save to local storage
        window.localStorage.setItem(key, superjson.stringify(newValue));

        // We dispatch a custom event so every useLocalStorage hook are notified
        if (shareState !== false) {
          window.dispatchEvent(new Event("local-storage"));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
  );

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent)?.key && (event as StorageEvent).key !== key) {
        return;
      }
      setStoredValue(readValue());
    },
    [key, readValue],
  );

  // this only works for other documents, not the current one
  useEventListener("storage", handleStorageChange);

  // this is a custom event, triggered in writeValueToLocalStorage
  // See: useLocalStorage()
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

  // this only works for other documents, not the current one
  useEventListener("storage", handleStorageChange);

  // this is a custom event, triggered in writeValueToLocalStorage
  // See: useLocalStorage()
  useEventListener("local-storage", handleStorageChange);
}
