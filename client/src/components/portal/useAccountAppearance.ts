import { useCallback, useEffect, useState } from "react";
import { getPortalPalette, type PortalMode, type PortalPaletteId } from "./portalPalettes";

export interface AppearancePreference { mode: PortalMode; palette: PortalPaletteId }
export const appearanceStorageKey = (account: string) => `bfo-portal-appearance:${encodeURIComponent(account)}`;

export function readAppearance(account: string | null, storage?: Pick<Storage, "getItem">) {
  const defaults: AppearancePreference = { mode: "light", palette: "navy-amber" };
  if (!account) return { preference: defaults, storageAvailable: false };
  try {
    const source = storage || window.localStorage;
    const raw = source.getItem(appearanceStorageKey(account));
    if (!raw) {
      // Preserve the old mode on the first visit; new choices never write this
      // formerly global key, so one account cannot overwrite another's choice.
      const legacyMode = source.getItem("bfo-portal-theme");
      return { preference: { ...defaults, mode: legacyMode === "dark" ? "dark" as const : "light" as const }, storageAvailable: true };
    }
    let data: Partial<AppearancePreference>;
    try { data = JSON.parse(raw); } catch { data = {}; }
    return {
      preference: {
        mode: data?.mode === "dark" ? "dark" as const : "light" as const,
        palette: getPortalPalette(data?.palette).id,
      },
      storageAvailable: true,
    };
  } catch {
    return { preference: defaults, storageAvailable: false };
  }
}

export function useAccountAppearance(account: string | null) {
  const [state, setState] = useState(() => ({ account, ...readAppearance(account) }));
  // Never render the previous account's colours while identity is changing.
  const current = state.account === account ? state : { account, ...readAppearance(account) };
  useEffect(() => {
    if (state.account !== account) setState({ account, ...readAppearance(account) });
  }, [account, state.account]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (account && (event.key === appearanceStorageKey(account) || event.key === null)) {
        setState({ account, ...readAppearance(account) });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [account]);

  const save = useCallback((patch: Partial<AppearancePreference>) => {
    setState((previous) => {
      const base = previous.account === account ? previous.preference : readAppearance(account).preference;
      const preference = { ...base, ...patch };
      let storageAvailable = !!account;
      try {
        // Idempotent account-scoped write; functional updates also preserve
        // both choices when palette and mode are changed in the same batch.
        if (account) localStorage.setItem(appearanceStorageKey(account), JSON.stringify(preference));
      } catch { storageAvailable = false; }
      return { account, preference, storageAvailable };
    });
  }, [account]);
  const setTheme = useCallback((mode: PortalMode) => save({ mode }), [save]);
  const setPalette = useCallback((palette: PortalPaletteId) => save({ palette: getPortalPalette(palette).id }), [save]);
  return { theme: current.preference.mode, palette: current.preference.palette, setTheme, setPalette, storageAvailable: current.storageAvailable };
}
