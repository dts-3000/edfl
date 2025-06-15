import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { initializeFirebase } from "@/lib/firebase"

// Initialize Firebase
initializeFirebase()
const storage = getStorage()

export interface UploadResult {
  url: string
  filename: string
  size: number
}

export async function uploadImage(file: File, path: string): Promise<UploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error("File size must be less than 10MB")
    }

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const fullPath = `${path}/${filename}`

    // Upload to Firebase Storage
    const storageRef = ref(storage, fullPath)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      url: downloadURL,
      filename: fullPath,
      size: file.size,
    }
  } catch (error: any) {
    console.error("Error uploading image:", error)

    // Provide specific error messages
    if (error.code === "storage/unauthorized") {
      throw new Error("Permission denied. Please check Firebase Storage rules.")
    } else if (error.code === "storage/canceled") {
      throw new Error("Upload was canceled.")
    } else if (error.code === "storage/unknown") {
      throw new Error("Unknown error occurred during upload.")
    } else {
      throw new Error(error.message || "Failed to upload image")
    }
  }
}

export async function deleteImage(filename: string): Promise<void> {
  try {
    const storageRef = ref(storage, filename)
    await deleteObject(storageRef)
  } catch (error: any) {
    console.error("Error deleting image:", error)

    if (error.code === "storage/object-not-found") {
      // File doesn't exist, which is fine
      return
    }

    throw new Error(error.message || "Failed to delete image")
  }
}

export async function uploadMultipleImages(files: FileList, path: string): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImage(files[i], path)
      results.push(result)
    } catch (error: any) {
      errors.push(`${files[i].name}: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    console.warn("Some uploads failed:", errors)
  }

  return results
}
