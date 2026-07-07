/**
 * Browser-storage namespacing.
 *
 * `localStorage` / `sessionStorage` / IndexedDB are isolated per *origin*,
 * not per *path*. When the app is embedded as a sub-system under a shared
 * origin (e.g. `https://portal.customer.com/gpustack/` alongside other
 * apps or another GPUStack instance), bare storage keys collide and clobber
 * each other. Prefixing every key with a per-deployment namespace fixes it.
 *
 * The namespace is derived from `window.location.pathname`. The host uses
 * **hash history**, so the pathname equals the deploy base path and stays
 * constant across in-app navigation — it is the natural per-instance
 * discriminator and is available at the earliest module-eval time (before
 * React, for the non-React readers in the access / request seams).
 *
 * Root deployments (`base '/'`) get an EMPTY prefix, so their keys are
 * byte-for-byte identical to the pre-namespacing behavior — existing users
 * keep their persisted state on upgrade. Only sub-path deployments opt into
 * the prefix.
 *
 * All storage access across the three packages must route through the
 * helpers here (`nsLocal` / `nsSession` / `nsLocalJSONStorage` for jotai,
 * `NS_STORE_NAME` for localForage). Keys shared across packages — notably
 * `currentOrganizationId`, read/written by the OSS atoms, the enterprise
 * atoms, and the access/request seams — only stay in sync because every
 * side computes the same prefix from this single source.
 */

const BRAND = 'gpustack';

// Legacy localForage instance name (root deploy). Kept verbatim so root
// deployments continue reading their existing IndexedDB store on upgrade.
const LEGACY_STORE_NAME = '_xWXJKJ_S1Sna_';

// Deploy base path → namespace segment. Empty string for root deploy.
// Under hash history `pathname` is the base path (e.g. `/gpustack/`);
// strip a trailing file segment (`.../index.html`), trim slashes, and
// sanitize to a key/DB-safe token.
function computeNamespaceSegment(): string {
  if (typeof window === 'undefined') return '';
  let path = window.location?.pathname || '/';
  path = path.replace(/\/[^/]*\.[^/]*$/, '/'); // drop trailing `index.html` etc.
  const trimmed = path.replace(/^\/+|\/+$/g, ''); // `a/b` or ``
  return trimmed.replace(/[^a-zA-Z0-9_-]+/g, '-'); // `a-b`
}

const SEGMENT = computeNamespaceSegment();

/** Key prefix applied to every namespaced key. Empty for root deploys. */
export const STORAGE_PREFIX = SEGMENT ? `${BRAND}:${SEGMENT}:` : '';

/** localForage instance name; distinct IndexedDB store per sub-path deploy. */
export const NS_STORE_NAME = SEGMENT
  ? `${BRAND}_${SEGMENT}`
  : LEGACY_STORE_NAME;

/** Prefix a bare storage key with the deployment namespace. */
export const nsKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

// —— Raw string read/write for non-React callers (access / request seams,
// probes, direct atom-file readers). Defensive: storage may be unavailable
// (SSR, Safari private mode) — mirror the existing try/catch call sites. ——

interface RawStorage {
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
      const store = getStore();
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
