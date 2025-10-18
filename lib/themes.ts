import { Theme, validateTheme } from "theme-o-rama";

export function hasTag(theme: Theme, tag: string): boolean {
  return theme.tags?.includes(tag) === true;
}

export function validateThemeJson(json: string): void {
  const theme = validateTheme(json);
  if (
    theme?.buttonStyle !== undefined &&
    theme?.buttonStyle !== "gradient" &&
    theme?.buttonStyle !== "shimmer" &&
    theme?.buttonStyle !== "pixel-art" &&
    theme?.buttonStyle !== "3d-effects" &&
    theme?.buttonStyle !== "rounded-buttons"
  ) {
    throw new Error(`Invalid button style: ${theme?.buttonStyle}`);
  }
}

// Dynamically discover theme folders by scanning the themes directory
// eslint-disable-next-line require-await
export async function discoverThemes(): Promise<Theme[]> {
  try {
    // Use dynamic imports to discover available themes
    // const themeModules = import.meta.glob('../themes/*/theme.json', {
    //   eager: true,
    // });

    // // Extract theme JSON contents from the module paths
    // const themeContents = Object.entries(themeModules)
    //   .map(([path, module]) => {
    //     // Path format: "../themes/themeName/theme.json"
    //     const match = path.match(/\.\.\/themes\/([^/]+)\/theme\.json$/);
    //     if (match) {
    //       return module as Theme;
    //     }
    //     return null;
    //   })
    //   .filter((theme): theme is Theme => theme !== null);

    return [] as Theme[];
  } catch (error) {
    console.warn("Could not discover theme folders:", error);
    return [];
  }
}

// eslint-disable-next-line require-await
export async function resolveThemeImage(
  themeName: string,
  imagePath: string
): Promise<string> {
  return imagePath;
  // // If it's already a blob: URL, return it directly
  // if (imagePath.startsWith('blob:')) {
  //   return imagePath;
  // }

  // // Use static glob import to avoid dynamic import warnings for local files
  // const imageModules = import.meta.glob(
  //   '../themes/*/*.{jpg,jpeg,png,gif,webp}',
  //   { eager: true },
  // );
  // const resolvedPath = `../themes/${themeName}/${imagePath}`;
  // const imageModule = imageModules[resolvedPath];

  // if (imageModule) {
  //   return (imageModule as { default: string }).default;
  // }

  // return `../themes/${themeName}/${imagePath}`;
}
