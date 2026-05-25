/**
 * Service for managing files in Google Drive over HTTP.
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
}

/**
 * Lists backup files in Google Drive that were created by our portfolio application.
 * Filtered by name prefix "Project_Emergence_"
 */
export async function listDriveBackups(accessToken: string): Promise<GoogleDriveFile[]> {
  try {
    const q = encodeURIComponent("name contains 'Project_Emergence_' and trashed = false");
    const fields = encodeURIComponent("files(id, name, mimeType, createdTime, size)");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime+desc`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status} failed to list files`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("listDriveBackups error:", error);
    throw error;
  }
}

/**
 * Creates or overwrites a file in Google Drive.
 * Uses a robust two-step process:
 * 1. Creates file metadata in Drive
 * 2. Uploads the raw content via media update PATCH
 */
export async function createDriveBackup(
  accessToken: string,
  filename: string,
  mimeType: string,
  content: string
): Promise<GoogleDriveFile> {
  try {
    // 1. Create file index node (Metadata)
    const metadataResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Project_Emergence_${filename}`,
        mimeType: mimeType,
      }),
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Unable to create metadata node for file ${filename}`);
    }

    const fileNode = await metadataResponse.json();
    const fileId = fileNode.id;

    // 2. Patch file body with raw data
    const contentResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mimeType,
        },
        body: content,
      }
    );

    if (!contentResponse.ok) {
      const error = await contentResponse.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed to upload data stream content for fileId ${fileId}`);
    }

    const updatedNode = await contentResponse.json();
    return {
      id: fileId,
      name: `Project_Emergence_${filename}`,
      mimeType: mimeType,
      createdTime: new Date().toISOString(),
      size: String(content.length),
    };
  } catch (error) {
    console.error("createDriveBackup error:", error);
    throw error;
  }
}

/**
 * Deletes a file in Google Drive.
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status} delete operation failed.`);
    }

    return true;
  } catch (error) {
    console.error("deleteDriveFile error:", error);
    throw error;
  }
}

/**
 * Downloads file payload from Google Drive.
 */
export async function getDriveFileContent(accessToken: string, fileId: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} failed to download content`);
    }

    return await response.text();
  } catch (error) {
    console.error("getDriveFileContent error:", error);
    throw error;
  }
}
