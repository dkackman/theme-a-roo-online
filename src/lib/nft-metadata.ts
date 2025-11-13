import { Theme } from "theme-o-rama";
import { UploadedFile } from "./ipfs";

export function generateNftMetadata(
  theme: Theme,
  collectionId: string,
  description: string,
  author: string,
  twitterHandle: string,
  sponsor: string,
  website: string,
  creatorDid: string,
  files: UploadedFile[]
) {
  const iconUrl = files.find((file) => file.fileUseType === "preview")?.url;
  const bannerUrl = files.find((file) => file.fileUseType === "banner")?.url;
  const backgroundUrl = files.find(
    (file) => file.fileUseType === "background"
  )?.url;

  const finalTheme = JSON.parse(JSON.stringify(theme));
  finalTheme.name = collectionId;
  if (backgroundUrl) {
    finalTheme.backgroundImage = backgroundUrl;
  }

  const metadataObject = {
    format: "CHIP-0007",
    name: theme.displayName,
    description: description,
    attributes: [
      {
        trait_type: "Theme",
        value: theme.displayName,
      },
      {
        trait_type: "Author",
        value: author,
      },
      ...(backgroundUrl
        ? [
            {
              trait_type: "Background",
              // ipfs strips file extensions, so we need to check the source url
              value: theme?.backgroundImage?.toLowerCase().endsWith(".gif")
                ? "Animated GIF"
                : "Image",
            },
          ]
        : []),
    ],
    collection: {
      id: collectionId,
      name: `${theme.displayName.replace(/ Theme$/, "")} Theme`,
      attributes: [
        {
          type: "description",
          value: description,
        },
        ...(twitterHandle
          ? [
              {
                type: "twitter",
                value: twitterHandle,
              },
            ]
          : []),
        ...(sponsor
          ? [
              {
                type: "sponsor",
                value: sponsor,
              },
            ]
          : []),
        ...(website
          ? [
              {
                type: "website",
                value: website,
              },
            ]
          : []),
        ...(creatorDid
          ? [
              {
                type: "creator",
                value: creatorDid,
              },
            ]
          : []),
        ...(iconUrl
          ? [
              {
                type: "icon",
                value: iconUrl,
              },
            ]
          : []),
        ...(bannerUrl
          ? [
              {
                type: "banner",
                value: bannerUrl,
              },
            ]
          : []),
      ],
    },
    data: {
      theme: finalTheme,
    },
  };

  const metadataJson = JSON.stringify(metadataObject, null, 2);
  return metadataJson;
}
