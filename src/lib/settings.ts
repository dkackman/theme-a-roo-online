export interface Settings {
  /**
   * When true, prompt the user to save unsaved changes in the editor.
   */
  promptToSave: boolean;
}

const SETTINGS_STORAGE_KEY = "theme-a-roo-settings";

export const defaultSettings: Settings = {
  promptToSave: true,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save settings to localStorage:", error);
  }
}
