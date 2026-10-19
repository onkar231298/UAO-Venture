import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { PORTAL_PALETTES, type PortalPaletteId } from "./portalPalettes";
import { usePortalAppearance } from "./PortalTheme";
import "../../styles/portal-appearance.css";

type AppearanceMode = "light" | "dark";

export default function PortalAppearanceSettings() {
  const {
    theme,
    palette: paletteId,
    setPalette,
    setTheme,
    storageAvailable,
    syncStatus,
    accountSyncEnabled,
  } = usePortalAppearance();
  const paletteGroupRef = useRef<HTMLDivElement>(null);
  const modeGroupRef = useRef<HTMLDivElement>(null);
  const currentPalette = PORTAL_PALETTES.find((palette) => palette.id === paletteId) ?? PORTAL_PALETTES[0];

  const handleRadioKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    group: "palette" | "mode",
  ) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const options: string[] = group === "palette"
      ? PORTAL_PALETTES.map((palette) => palette.id)
      : (["light", "dark"] as AppearanceMode[]);
    const selectedIndex = group === "palette"
      ? options.indexOf(paletteId)
      : options.indexOf(theme);
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (selectedIndex + direction + options.length) % options.length;
    if (group === "palette") {
      setPalette(options[nextIndex] as PortalPaletteId);
      paletteGroupRef.current?.querySelector<HTMLButtonElement>(`[data-value="${options[nextIndex]}"]`)?.focus();
    } else {
      setTheme(options[nextIndex] as AppearanceMode);
      modeGroupRef.current?.querySelector<HTMLButtonElement>(`[data-value="${options[nextIndex]}"]`)?.focus();
    }
  };

  return (
    <section className="portal-appearance" data-testid="appearance-settings" aria-labelledby="appearance-title">
      <header className="portal-appearance__heading">
        <div className="portal-appearance__heading-mark" aria-hidden="true"><Monitor size={17} /></div>
        <div>
          <h2 id="appearance-title">Appearance</h2>
          <p>Make your workspace feel like yours.</p>
        </div>
      </header>

      <div className="portal-appearance__scope" role="note">
        <span className="portal-appearance__scope-dot" aria-hidden="true" />
        <span>
          <strong>Personal setting</strong> — {accountSyncEnabled
            ? "saved to your staff account and available wherever you sign in. It won’t change the workspace for teammates or the public website."
            : "saved in this browser only. It won’t change the workspace for teammates or the public website."}
        </span>
      </div>
      {accountSyncEnabled && syncStatus === "loading" && (
        <p className="portal-appearance__sync-status" role="status">Loading your saved account appearance…</p>
      )}
      {accountSyncEnabled && syncStatus === "saving" && (
        <p className="portal-appearance__sync-status" role="status">Saving your appearance to your account…</p>
      )}
      {accountSyncEnabled && syncStatus === "saved" && (
        <p className="portal-appearance__sync-status" role="status">Appearance saved to your account.</p>
      )}
      {accountSyncEnabled && syncStatus === "error" && (
        <p className="portal-appearance__warning portal-appearance__warning--error" role="alert">
          Your appearance could not be loaded or saved to your account. Your current choice is kept in this browser; check your connection and try again.
        </p>
      )}
      {!storageAvailable && (
        <p className="portal-appearance__warning" role="status">
          {accountSyncEnabled
            ? "Your browser could not save a local copy. Account syncing may still keep your preference available on other devices."
            : "Your browser can’t save this preference right now. Changes will last for this session only."}
        </p>
      )}

      <div className="portal-appearance__section">
        <div className="portal-appearance__section-heading">
          <div>
            <h3>Workspace palette</h3>
            <p>Coordinated colours across navigation, surfaces and accents.</p>
          </div>
          <span className="portal-appearance__count">4 palettes</span>
        </div>
        <div
          ref={paletteGroupRef}
          className="portal-appearance__palette-grid"
          role="radiogroup"
          aria-label="Workspace palette"
          onKeyDown={(event) => handleRadioKeyDown(event, "palette")}
        >
          {PORTAL_PALETTES.map((palette) => {
            const selected = palette.id === currentPalette.id;
            return (
              <button
                key={palette.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${palette.name}: ${palette.description}`}
                data-testid={`theme-palette-${palette.id}`}
                data-value={palette.id}
                tabIndex={selected ? 0 : -1}
                className={`portal-appearance__palette${selected ? " is-selected" : ""}`}
                style={{
                  "--palette-accent": palette.accent,
                } as CSSProperties}
                onClick={() => setPalette(palette.id)}
              >
                <span className="portal-appearance__palette-top">
                  <span className="portal-appearance__palette-name">{palette.name}</span>
                  <span className="portal-appearance__selected" aria-hidden="true">
                    {selected && <Check size={13} strokeWidth={2.5} />}
                  </span>
                </span>
                <span className="portal-appearance__palette-description">{palette.description}</span>
                <span className="portal-appearance__swatches" aria-hidden="true">
                  <i style={{ backgroundColor: palette.sidebar }} />
                  <i style={{ backgroundColor: palette.accent }} />
                  <i style={{ backgroundColor: palette.light.bg }} />
                  <i style={{ backgroundColor: palette.light.panel }} />
                  <i style={{ backgroundColor: palette.light.text }} />
                  <i style={{ backgroundColor: palette.dark.bg }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="portal-appearance__section portal-appearance__mode-section">
        <div className="portal-appearance__section-heading">
          <div>
            <h3>Display mode</h3>
            <p>Choose the surface that’s easiest on your eyes.</p>
          </div>
        </div>
        <div
          ref={modeGroupRef}
          className="portal-appearance__mode-options"
          role="radiogroup"
          aria-label="Display mode"
          onKeyDown={(event) => handleRadioKeyDown(event, "mode")}
        >
          <button
            type="button"
            role="radio"
            aria-checked={theme === "light"}
            data-testid="appearance-mode-light"
            data-value="light"
            tabIndex={theme === "light" ? 0 : -1}
            className={`portal-appearance__mode${theme === "light" ? " is-selected" : ""}`}
            onClick={() => setTheme("light")}
          >
            <Sun size={16} aria-hidden="true" />
            <span>Light</span>
            {theme === "light" && <Check className="portal-appearance__mode-check" size={14} aria-hidden="true" />}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === "dark"}
            data-testid="appearance-mode-dark"
            data-value="dark"
            tabIndex={theme === "dark" ? 0 : -1}
            className={`portal-appearance__mode${theme === "dark" ? " is-selected" : ""}`}
            onClick={() => setTheme("dark")}
          >
            <Moon size={16} aria-hidden="true" />
            <span>Dark</span>
            {theme === "dark" && <Check className="portal-appearance__mode-check" size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="portal-appearance__preview-block">
        <div className="portal-appearance__preview-label">
          <div>
            <h3>Live preview</h3>
            <p>{currentPalette.name} · {theme} mode</p>
          </div>
          <span className="portal-appearance__live"><span /> Updates instantly</span>
        </div>
        <div
          className={`portal-appearance__preview portal-appearance__preview--${theme}`}
          style={{
            "--preview-bg": currentPalette[theme].bg,
            "--preview-panel": currentPalette[theme].panel,
            "--preview-text": currentPalette[theme].text,
            "--preview-sidebar": currentPalette.sidebar,
            "--preview-accent": currentPalette.accent,
          } as CSSProperties}
          aria-label={`${currentPalette.name} ${theme} mode workspace preview`}
        >
          <div className="portal-appearance__preview-sidebar">
            <span className="portal-appearance__preview-brand" />
            <span className="portal-appearance__preview-nav is-active" />
            <span className="portal-appearance__preview-nav" />
            <span className="portal-appearance__preview-nav" />
            <span className="portal-appearance__preview-avatar">AM</span>
          </div>
          <div className="portal-appearance__preview-main">
            <div className="portal-appearance__preview-toolbar">
              <span className="portal-appearance__preview-title" />
              <span className="portal-appearance__preview-action" />
            </div>
            <div className="portal-appearance__preview-stats">
              <div><span className="portal-appearance__preview-line" /><b>24</b><span className="portal-appearance__preview-metric" /></div>
              <div><span className="portal-appearance__preview-line" /><b>08</b><span className="portal-appearance__preview-metric" /></div>
              <div><span className="portal-appearance__preview-line" /><b>63%</b><span className="portal-appearance__preview-metric" /></div>
            </div>
            <div className="portal-appearance__preview-table">
              <span /><span /><span />
            </div>
          </div>
        </div>
        <span className="portal-appearance__preview-caption">Navigation · workspace surface · cards · accent</span>
      </div>
    </section>
  );
}
