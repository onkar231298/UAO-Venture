import { useCallback, useEffect, useRef, useState } from "react";
import { getPortalPalette, type PortalMode, type PortalPaletteId } from "./portalPalettes";

export interface AppearancePreference { mode: PortalMode; palette: PortalPaletteId }
export type AppearanceSyncStatus = "local" | "loading" | "ready" | "saving" | "saved" | "error";
type AppearanceState = {
  account: string | null;
  preference: AppearancePreference;
  storageAvailable: boolean;
  syncStatus: AppearanceSyncStatus;
};

const DEFAULT_PREFERENCE: AppearancePreference = { mode: "light", palette: "navy-amber" };
export const appearanceStorageKey = (account: string) => `bfo-portal-appearance:${encodeURIComponent(account)}`;
export const isStaffAppearanceAccount = (account: string | null) => !!account?.startsWith("staff:");

export function normalizeAppearance(value: unknown): AppearancePreference {
  const data = value && typeof value === "object"
    ? value as Partial<AppearancePreference>
    : {};
  return {
    mode: data.mode === "dark" ? "dark" : "light",
    palette: getPortalPalette(data.palette).id,
  };
}

export function readAppearance(
  account: string | null,
  storage?: Pick<Storage, "getItem">,
): { preference: AppearancePreference; storageAvailable: boolean; hasAccountChoice: boolean } {
  if (!account) return { preference: DEFAULT_PREFERENCE, storageAvailable: false, hasAccountChoice: false };
  try {
    const source = storage || window.localStorage;
    const raw = source.getItem(appearanceStorageKey(account));
    if (!raw) {
      // Older portal builds stored only the mode globally; migrate it only when
      // the account has no saved server preference.
      const legacyMode = source.getItem("bfo-portal-theme");
      const hasLegacyChoice = legacyMode === "dark" || legacyMode === "light";
      const preference: AppearancePreference = {
        ...DEFAULT_PREFERENCE,
        mode: legacyMode === "dark" ? "dark" : "light",
      };
      return {
        preference,
        storageAvailable: true,
        hasAccountChoice: hasLegacyChoice,
      };
    }
    let data: unknown;
    try { data = JSON.parse(raw); } catch { data = null; }
    return {
      preference: normalizeAppearance(data),
      storageAvailable: true,
      hasAccountChoice: true,
    };
  } catch {
    return { preference: DEFAULT_PREFERENCE, storageAvailable: false, hasAccountChoice: false };
  }
}

function writeLocalPreference(account: string | null, preference: AppearancePreference): boolean {
  if (!account) return false;
  try {
    localStorage.setItem(appearanceStorageKey(account), JSON.stringify(preference));
    return true;
  } catch {
    return false;
  }
}

function initialState(account: string | null): AppearanceState {
  const local = readAppearance(account);
  return {
    account,
    preference: local.preference,
    storageAvailable: local.storageAvailable,
    syncStatus: isStaffAppearanceAccount(account) ? "loading" : "local",
  };
}

export function appearanceForAccount(
  state: Pick<AppearanceState, "account" | "preference">,
  account: string | null,
  fallback = readAppearance(account).preference,
): AppearancePreference {
  return state.account === account ? state.preference : fallback;
}

export function useAccountAppearance(account: string | null) {
  const [state, setState] = useState(() => initialState(account));
  const stateRef = useRef(state);
  const activeAccountRef = useRef(account);
  const pendingPatchesRef = useRef(new Map<string, Partial<AppearancePreference>>());
  const saveQueuesRef = useRef(new Map<string, Promise<AppearancePreference | null>>());
  const writeRevisionRef = useRef(new Map<string, number>());

  // Keep an old account's colours from flashing while the new identity loads.
  activeAccountRef.current = account;
  const commit = useCallback((next: AppearanceState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const queueServerSave = useCallback((
    staffAccount: string,
    preference: AppearancePreference,
    onlyIfMissing = false,
  ) => {
    const revision = (writeRevisionRef.current.get(staffAccount) || 0) + 1;
    writeRevisionRef.current.set(staffAccount, revision);
    const previous = saveQueuesRef.current.get(staffAccount) || Promise.resolve(null);
    const request = previous.catch(() => null).then(async () => {
      if (activeAccountRef.current !== staffAccount) {
        throw new Error("The signed-in account changed before this preference could be saved.");
      }
      const response = await fetch("/api/auth/appearance", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preference, ...(onlyIfMissing ? { onlyIfMissing: true } : {}) }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Save failed (${response.status})`);
      }
      const result = await response.json() as { preference?: unknown };
      return result.preference ? normalizeAppearance(result.preference) : preference;
    });
    saveQueuesRef.current.set(staffAccount, request);
    request.then((savedPreference) => {
      if (writeRevisionRef.current.get(staffAccount) !== revision ||
          activeAccountRef.current !== staffAccount) return;
      const storageAvailable = writeLocalPreference(staffAccount, savedPreference);
      const current = stateRef.current;
      if (current.account === staffAccount) {
        commit({ ...current, preference: savedPreference, storageAvailable, syncStatus: "saved" });
      }
    }).catch(() => {
      if (writeRevisionRef.current.get(staffAccount) !== revision ||
          activeAccountRef.current !== staffAccount) return;
      const current = stateRef.current;
      if (current.account === staffAccount) commit({ ...current, syncStatus: "error" });
    });
    return request;
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    const local = readAppearance(account);
    const staffAccount = account && isStaffAppearanceAccount(account) ? account : null;
    const generationAccount = account;
    pendingPatchesRef.current.delete(account || "");
    commit({
      account,
      preference: local.preference,
      storageAvailable: local.storageAvailable,
      syncStatus: staffAccount ? "loading" : "local",
    });
    if (!staffAccount) return () => { cancelled = true; };

    const load = async () => {
      try {
        const response = await fetch("/api/auth/appearance", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Load failed (${response.status})`);
        const result = await response.json() as { preference?: unknown };
        if (cancelled || activeAccountRef.current !== generationAccount) return;

        const remotePreference = result.preference ? normalizeAppearance(result.preference) : null;
        const pending = pendingPatchesRef.current.get(staffAccount) || {};
        const hasPendingChanges = Object.keys(pending).length > 0;
        const selected: AppearancePreference = {
          ...(remotePreference || local.preference),
          ...pending,
        };
        const shouldCacheLocally = !!remotePreference || hasPendingChanges || local.hasAccountChoice;
        const localSaved = shouldCacheLocally
          ? writeLocalPreference(staffAccount, selected)
          : local.storageAvailable;

        if (hasPendingChanges) {
          commit({
            account: staffAccount,
            preference: selected,
            storageAvailable: localSaved,
            syncStatus: "saving",
          });
          await queueServerSave(staffAccount, selected);
          pendingPatchesRef.current.delete(staffAccount);
        } else if (remotePreference) {
          commit({
            account: staffAccount,
            preference: remotePreference,
            storageAvailable: localSaved,
            syncStatus: "saved",
          });
        } else if (local.hasAccountChoice) {
          commit({
            account: staffAccount,
            preference: selected,
            storageAvailable: localSaved,
            syncStatus: "saving",
          });
          // A conditional write prevents this browser migration from replacing
          // an account choice saved by another device after the initial read.
          const migrated = await queueServerSave(staffAccount, selected, true);
          if (!cancelled && activeAccountRef.current === staffAccount) {
            commit({
              account: staffAccount,
              preference: migrated,
              storageAvailable: writeLocalPreference(staffAccount, migrated),
              syncStatus: "saved",
            });
          }
        } else {
          commit({
            account: staffAccount,
            preference: selected,
            storageAvailable: local.storageAvailable,
            syncStatus: "ready",
          });
        }
      } catch {
        if (!cancelled && activeAccountRef.current === generationAccount) {
          commit({ ...stateRef.current, account: staffAccount, syncStatus: "error" });
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [account, commit, queueServerSave]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!account || (event.key !== appearanceStorageKey(account) && event.key !== null)) return;
      const local = readAppearance(account);
      const current = stateRef.current;
      if (current.account === account && current.syncStatus !== "loading") {
        commit({
          ...current,
          preference: local.preference,
          storageAvailable: local.storageAvailable,
          syncStatus: isStaffAppearanceAccount(account) ? current.syncStatus : "local",
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [account, commit]);

  const save = useCallback((patch: Partial<AppearancePreference>) => {
    if (!account || activeAccountRef.current !== account) return;
    const current = stateRef.current;
    const base = current.account === account ? current.preference : readAppearance(account).preference;
    const preference = normalizeAppearance({ ...base, ...patch });
    const isStaff = isStaffAppearanceAccount(account);
    const isLoading = isStaff && current.account === account && current.syncStatus === "loading";
    const storageAvailable = writeLocalPreference(account, preference);
    const status: AppearanceSyncStatus = !isStaff
      ? "local"
      : isLoading ? "loading" : "saving";
    commit({ account, preference, storageAvailable, syncStatus: status });

    if (isLoading) {
      pendingPatchesRef.current.set(account, {
        ...pendingPatchesRef.current.get(account),
        ...patch,
      });
    } else if (isStaff) {
      void queueServerSave(account, preference);
    }
  }, [account, commit, queueServerSave]);

  const setTheme = useCallback((mode: PortalMode) => save({ mode }), [save]);
  const setPalette = useCallback((palette: PortalPaletteId) => save({ palette }), [save]);
  const current = state.account === account ? state : initialState(account);
  const preference = appearanceForAccount(current, account, current.preference);
  return {
    theme: preference.mode,
    palette: preference.palette,
    setTheme,
    setPalette,
    storageAvailable: current.storageAvailable,
    syncStatus: current.syncStatus,
    accountSyncEnabled: isStaffAppearanceAccount(account),
  };
}
