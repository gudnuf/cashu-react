import { CashuStorageKey, Storage } from "../types";

export class LocalStorageAdapter implements Storage {
  async put<T>(key: CashuStorageKey, value: T): Promise<void> {
    try {
      /* Special handling for Date objects */
      const serializedValue = JSON.stringify(value, (_, v) => {
        if (v instanceof Date) {
          return { __type: "Date", value: v.toISOString() };
        }
        return v;
      });

      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw new Error(`Failed to store data for key ${key}`);
    }
  }

  async get<T>(key: CashuStorageKey): Promise<T> {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        throw new Error(`Key ${key} not found in storage`);
      }

      /* Parse with special handling for Date objects */
      const parsed = JSON.parse(value, (_, v) => {
        if (v && typeof v === "object" && v.__type === "Date") {
          return new Date(v.value);
        }
        return v;
      });

      return parsed as T;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      throw new Error(`Failed to retrieve data for key ${key}`);
    }
  }

  async delete(key: CashuStorageKey): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error deleting data for key ${key}:`, error);
      throw new Error(`Failed to delete data for key ${key}`);
    }
  }
}
