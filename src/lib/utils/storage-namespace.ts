/**
 * Browser-storage namespacing.
 *
 * `localStorage` / `sessionStorage` / IndexedDB are isolated per *origin*,
 * not per *path*. When the app is embedded as a sub-system under a shared
 * origin (e.g. `https://portal.customer.com/gpustack/` alongside other
 * apps), bare keys like `userSettings` collide with whatever the neighbours
 * store under the same name. Prefixing every key with a fixed brand
 * namespace fixes that.
 *
 * The namespace is a CONSTANT — deliberately not derived from
 * `window.location.pathname` or any other runtime input. A path-derived
 * namespace makes the whole persisted state depend on the URL the user
 * happened to type: a typo'd path (on a host with a catch-all rewrite) or a
 * second proxy alias pointing at the same instance would silently switch the
 * app onto a different set of keys. A constant is immune to all of it and is
 * available at the earliest module-eval time (before React, for the
 * non-React readers in the access / request seams).
 *
 * Trade-off: two GPUStack instances under the SAME origin (`/a/` and `/b/`)
 * share one namespace and will still clobber each other. That is accepted —
 * co-hosting two instances on one origin is not a supported topology, while
 * co-hosting GPUStack next to other apps is.
 *
 * All storage access across the three packages must route through the
 * helpers here (`nsLocal` / `nsSession` / `nsLocalJSONStorage` for jotai,
 * `NS_STORE_NAME` for localForage). Keys shared across packages — notably
 * `currentOrganizationId`, read/written by the OSS atoms, the enterprise
 * atoms, and the access/request seams — only stay in sync because every
 * side goes through this single source.
 */

const BRAND = 'gpustack';

/** Key prefix applied to every namespaced key. */
export const STORAGE_PREFIX = `${BRAND}:`;

/**
 * localForage instance name.
 *
 * Left at its historical value on purpose: an IndexedDB database cannot be
 * renamed in place, so changing it would strand the existing store (column
 * settings, `is_first_login`) instead of migrating it. The name is already
 * unique enough that no neighbouring app would pick it, which is all the
 * prefix buys elsewhere — so there is nothing to gain by renaming it.
 */
export const NS_STORE_NAME = '_xWXJKJ_S1Sna_';

/** Prefix a bare storage key with the brand namespace. */
export const nsKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

// —— Raw string read/write for non-React callers (access / request seams,
// probes, direct atom-file readers). Defensive: storage may be unavailable
// (SSR, Safari private mode) — mirror the existing try/catch call sites. ——

/**
 * Namespaced raw-string storage. Every method fails soft: a missing key,
 * an unavailable store and a throwing store all collapse to `null` / a
 * no-op. Callers that must distinguish "storage threw" from "key absent"
 * — e.g. a fail-closed guard that has to decline when it can't record an
 * attempt — cannot use this and should talk to `Storage` directly.
 */
export interface RawStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function makeRawStorage(getStore: () => Storage | undefined): RawStorage {
  return {
    get(key) {
      try {
        return getStore()?.getItem(nsKey(key)) ?? null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        getStore()?.setItem(nsKey(key), value);
      } catch {
        // ignore — storage unavailable
      }
    },
    remove(key) {
      try {
        getStore()?.removeItem(nsKey(key));
      } catch {
        // ignore — storage unavailable
      }
    }
  };
}

export const nsLocal: RawStorage = makeRawStorage(() =>
  typeof window === 'undefined' ? undefined : window.localStorage
);

export const nsSession: RawStorage = makeRawStorage(() =>
  typeof window === 'undefined' ? undefined : window.sessionStorage
);

// —— jotai `atomWithStorage` storage. Replicates jotai's default
// `createJSONStorage(() => localStorage)` — JSON parse/stringify plus a
// cross-tab `subscribe` via the `storage` event — while prefixing the key.
// Passing this as the 3rd arg to `atomWithStorage` keeps the atom's key
// constant in source while the physical key is namespaced. ——

interface JSONStorage<Value> {
  getItem: (key: string, initialValue: Value) => Value;
  setItem: (key: string, newValue: Value) => void;
  removeItem: (key: string) => void;
  subscribe?: (
    key: string,
    callback: (value: Value) => void,
    initialValue: Value
  ) => () => void;
}

function makeJSONStorage<Value>(getStore: () => Storage | undefined) {
  const storage: JSONStorage<Value> = {
    getItem(key, initialValue) {
      let str: string | null = null;
      try {
        str = getStore()?.getItem(nsKey(key)) ?? null;
      } catch {
        return initialValue;
      }
      if (str == null) return initialValue;
      try {
        return JSON.parse(str) as Value;
      } catch {
        return initialValue;
      }
    },
    setItem(key, newValue) {
      try {
        getStore()?.setItem(nsKey(key), JSON.stringify(newValue));
      } catch {
        // ignore — storage unavailable
      }
    },
    removeItem(key) {
      try {
        getStore()?.removeItem(nsKey(key));
      } catch {
        // ignore — storage unavailable
      }
    }
  };

  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    storage.subscribe = (key, callback, initialValue) => {
      // Accessing window.localStorage can itself throw (blocked storage,
      // sandboxed iframe, Safari private mode) — guard before subscribing.
      let store: Storage | undefined;
      try {
        store = getStore();
      } catch {
        return () => {};
      }
      if (!store) return () => {};
      const physicalKey = nsKey(key);
      const handler = (e: StorageEvent) => {
        if (e.storageArea !== store || e.key !== physicalKey) return;
        let next: Value;
        try {
          next =
            e.newValue == null
              ? initialValue
              : (JSON.parse(e.newValue) as Value);
        } catch {
          next = initialValue;
        }
        callback(next);
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    };
  }

  return storage;
}

/** Namespaced JSON storage backed by `localStorage`, for `atomWithStorage`. */
export const nsLocalJSONStorage = makeJSONStorage<any>(() =>
  typeof window === 'undefined' ? undefined : window.localStorage
);
