import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  getDoc,
} from "firebase/firestore"

export interface Club {
  id?: string
  name: string
  slug: string
  location: string
  description: string
  founded: string
  colors: string
  homeGround: string
  current: boolean
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface ClubRecord {
  id?: string
  clubId: string
  type: "premiership" | "best-and-fairest" | "article"
  year: number
  title: string
  description?: string
  grade?: string
  coach?: string
  captain?: string
  player?: string
  votes?: number
  author?: string
  source?: string
  images?: string[]
  createdAt: Date
  updatedAt: Date
}

// Get all clubs
export async function getClubs(): Promise<Club[]> {
  try {
    console.log("Getting clubs from Firebase...")
    const clubsCollection = collection(db, "clubs")
    const q = query(clubsCollection, orderBy("name"))
    const querySnapshot = await getDocs(q)

    const clubs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Club[]

    console.log(`Found ${clubs.length} clubs`)
    return clubs
  } catch (error) {
    console.error("Error getting clubs:", error)
    throw error
  }
}

// Get club by slug
export async function getClubBySlug(slug: string): Promise<Club | null> {
  try {
    console.log("Getting club by slug:", slug)
    const clubsCollection = collection(db, "clubs")
    const q = query(clubsCollection, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("No club found with slug:", slug)
      return null
    }

    const doc = querySnapshot.docs[0]
    const club = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Club

    console.log("Found club:", club.name)
    return club
  } catch (error) {
    console.error("Error getting club by slug:", error)
    throw error
  }
}

// Get club records
export async function getClubRecords(clubId: string): Promise<ClubRecord[]> {
  try {
    console.log("Getting records for club:", clubId)
    const recordsCollection = collection(db, "clubs", clubId, "records")
    const q = query(recordsCollection, orderBy("year", "desc"))
    const querySnapshot = await getDocs(q)

    const records = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      clubId,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ClubRecord[]

    console.log(`Found ${records.length} records for club ${clubId}`)
    return records
  } catch (error) {
    console.error("Error getting club records:", error)
    throw error
  }
}

// Add club
export async function addClub(clubData: Omit<Club, "createdAt" | "updatedAt" | "id">) {
  try {
    console.log("Adding club:", clubData.name)
    const club = {
      ...clubData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "clubs"), club)
    console.log("Club added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding club:", error)
    throw error
  }
}

// Update club
export async function updateClub(clubId: string, clubData: Partial<Club>) {
  try {
    console.log("Updating club:", clubId)
    const clubRef = doc(db, "clubs", clubId)
    await updateDoc(clubRef, {
      ...clubData,
      updatedAt: new Date(),
    })
    console.log("Club updated successfully")
  } catch (error) {
    console.error("Error updating club:", error)
    throw error
  }
}

// Delete club
export async function deleteClub(clubId: string) {
  try {
    console.log("Deleting club:", clubId)
    const clubRef = doc(db, "clubs", clubId)
    await deleteDoc(clubRef)
    console.log("Club deleted successfully")
  } catch (error) {
    console.error("Error deleting club:", error)
    throw error
  }
}

// Add club record - FIXED VERSION with Historical Club Support
export async function addClubRecord(
  clubId: string,
  recordData: Omit<ClubRecord, "createdAt" | "updatedAt" | "id" | "clubId">,
) {
  try {
    console.log("=== ADDING CLUB RECORD ===")
    console.log("Club ID:", clubId)
    console.log("Record Data:", recordData)

    // Validate required fields
    if (!clubId) {
      throw new Error("Club ID is required")
    }
    if (!recordData.type) {
      throw new Error("Record type is required")
    }
    if (!recordData.year) {
      throw new Error("Year is required")
    }
    if (!recordData.title) {
      throw new Error("Title is required")
    }

    // Check if club exists first
    console.log("🔍 Checking if club exists...")
    const clubsCollection = collection(db, "clubs")
    const clubDoc = doc(clubsCollection, clubId)
    const clubSnap = await getDoc(clubDoc)

    if (!clubSnap.exists()) {
      console.error("❌ Club does not exist:", clubId)
      throw new Error(`Club with ID ${clubId} does not exist`)
    }

    const clubData = clubSnap.data()
    console.log("✅ Club found:", {
      name: clubData.name,
      current: clubData.current,
      status: clubData.status,
    })

    const record = {
      ...recordData,
      clubId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Final record to save:", record)

    // Try to create the subcollection path
    const recordsCollection = collection(db, "clubs", clubId, "records")
    console.log("Collection path:", `clubs/${clubId}/records`)

    // Test if we can write to this path
    console.log("🔄 Attempting to write to Firebase...")
    const docRef = await addDoc(recordsCollection, record)
    console.log("✅ Record added successfully with ID:", docRef.id)

    return docRef.id
  } catch (error) {
    console.error("❌ Error adding club record:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })

    // Additional debugging for historical clubs
    if (error.code === "permission-denied") {
      console.error("🚫 Permission denied - this might be a historical club issue")
      console.error("Check Firebase rules for subcollection access")
    }

    throw error
  }
}

// Delete club record
export async function deleteClubRecord(clubId: string, recordId: string) {
  try {
    console.log("Deleting record:", recordId, "from club:", clubId)
    const recordRef = doc(db, "clubs", clubId, "records", recordId)
    await deleteDoc(recordRef)
    console.log("Record deleted successfully")
  } catch (error) {
    console.error("Error deleting club record:", error)
    throw error
  }
}

// Check if club exists
export async function checkClubExists(slug: string) {
  try {
    const clubsCollection = collection(db, "clubs")
    const q = query(clubsCollection, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error("Error checking club exists:", error)
    throw error
  }
}

// Test function to verify Firebase connection
export async function testFirebaseConnection() {
  try {
    console.log("Testing Firebase connection...")

    // Test reading clubs
    const clubs = await getClubs()
    console.log("✅ Can read clubs:", clubs.length)

    // Test adding a simple record to the first club
    if (clubs.length > 0) {
      const testRecord = {
        type: "article" as const,
        year: 2024,
        title: "Test Record",
        description: "This is a test record",
      }

      const recordId = await addClubRecord(clubs[0].id!, testRecord)
      console.log("✅ Can add records:", recordId)

      // Clean up test record
      await deleteClubRecord(clubs[0].id!, recordId)
      console.log("✅ Can delete records")
    }

    return true
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error)
    throw error
  }
}
