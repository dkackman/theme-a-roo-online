import { PinataSDK, type GroupResponseItem } from "pinata";
import { FileUseType } from "./theme-files";

export interface UploadedFile {
  url: string;
  fileUseType: FileUseType;
}

export async function getFileUrl(
  apiKey: string,
  gatewayUrl: string,
  groupName: string,
  basename: string,
  fileUseType: FileUseType,
  imageUrl: string
): Promise<string | null> {
  const pinata = new PinataSDK({
    pinataJwt: apiKey,
    pinataGateway: gatewayUrl,
  });

  // Construct the expected filename pattern
  // We need to determine the extension from the imageUrl or try common extensions
  const urlExtension = imageUrl.split(".").pop()?.split("?")[0] || "png";
  const expectedFilename = `${basename}${fileUseType !== "preview" ? "-" + fileUseType : ""}.${urlExtension}`;

  // Try to find the file in Pinata
  let group: GroupResponseItem | null = null;
  if (groupName) {
    const groups = await pinata.groups.public.list();
    group = groups.groups.find((g) => g.name === groupName) || null;
  }

  if (!group) {
    // No group found, can't query
    return null;
  }

  try {
    // Query Pinata for files matching the filename in the specified group
    const files = await pinata.files.public
      .list()
      .name(expectedFilename)
      .group(group.id)
      .all();

    // Find the matching file (should be only one if found)
    const matchingFile = files.find((f) => f.name === expectedFilename);

    if (matchingFile && matchingFile.cid && matchingFile.cid !== "pending") {
      // Convert CID to gateway URL
      const url = await pinata.gateways.public.convert(matchingFile.cid);
      return url;
    }

    // File not found or still pending
    return null;
  } catch (error) {
    console.error("Error querying Pinata for file:", error);
    return null;
  }
}

export async function uploadFile(
  apiKey: string,
  gatewayUrl: string,
  groupName: string,
  basename: string,
  fileUseType: FileUseType,
  imageUrl: string
): Promise<UploadedFile> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const mimeType = detectMimeTypeFromBlob(blob);
  const extension = getFileExtensionFromMimeType(mimeType);
  const file = {
    file: new File(
      [blob],
      `${basename}${fileUseType !== "preview" ? "-" + fileUseType : ""}.${extension}`,
      {
        type: mimeType,
      }
    ),
    fileUseType: fileUseType,
  };

  const pinata = new PinataSDK({
    pinataJwt: apiKey,
    pinataGateway: gatewayUrl,
  });
  let group: GroupResponseItem | null = null;
  if (groupName) {
    const groups = await pinata.groups.public.list();
    group = groups.groups.find((g) => g.name === groupName) || null;
  }
  const uploadResult = await pinata.upload.public.file(
    file.file,
    group ? { groupId: group.id } : undefined
  );

  const url = await pinata.gateways.public.convert(uploadResult.cid);
  return {
    url,
    fileUseType: file.fileUseType,
  };
}

// Helper function to detect MIME type from blob data
function detectMimeTypeFromBlob(blob: Blob): string {
  // If blob already has a type, use it
  if (blob.type && blob.type !== "application/octet-stream") {
    return blob.type;
  }

  // Default to PNG if we can't detect the type
  return "image/png";
}

// Helper function to get file extension from MIME type
function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/ico": "ico",
    "application/json": "json",
  };

  return mimeToExt[mimeType] || "png";
}
