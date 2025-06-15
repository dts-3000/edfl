import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Club } from "@/types"

// Collection reference
const clubsCollection = collection(db, "clubs")

// Get all clubs
export async function getClubs(): Promise<Club[]> {
  try {
    const querySnapshot = await getDocs(query(clubsCollection, orderBy("name")))
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Club,
    )
  } catch (error) {
    console.error("Error fetching clubs:", error)
    throw new Error("Failed to fetch clubs")
  }
}

// Get club by ID
export async function getClub(id: string): Promise<Club | null> {
  try {
    const docRef = doc(clubsCollection, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Club
    }
    return null
  } catch (error) {
    console.error("Error fetching club:", error)
    throw new Error("Failed to fetch club")
  }
}

// Get club by slug
export async function getClubBySlug(slug: string): Promise<Club | null> {
  try {
    const q = query(clubsCollection, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as Club
    }
    return null
  } catch (error) {
    console.error("Error fetching club by slug:", error)
    throw new Error("Failed to fetch club")
  }
}

// Add new club
export async function addClub(clubData: Omit<Club, "id">): Promise<string> {
  try {
    const docRef = await addDoc(clubsCollection, {
      ...clubData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding club:", error)
    throw new Error("Failed to add club")
  }
}

// Update club
export async function updateClub(id: string, clubData: Partial<Club>): Promise<void> {
  try {
    const docRef = doc(clubsCollection, id)
    await updateDoc(docRef, {
      ...clubData,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating club:", error)
    throw new Error("Failed to update club")
  }
}

// Delete club
export async function deleteClub(id: string): Promise<void> {
  try {
    const docRef = doc(clubsCollection, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting club:", error)
    throw new Error("Failed to delete club")
  }
}

// Get club records (premierships, best & fairest, articles)
export async function getClubRecords(clubId: string) {
  try {
    // Get premierships
    const premiershipsRef = collection(db, "clubs", clubId, "premierships")
    const premiershipsSnap = await getDocs(query(premiershipsRef, orderBy("year", "desc")))
    const premierships = premiershipsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Get best & fairest
    const bestAndFairestRef = collection(db, "clubs", clubId, "bestAndFairest")
    const bestAndFairestSnap = await getDocs(query(bestAndFairestRef, orderBy("year", "desc")))
    const bestAndFairest = bestAndFairestSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Get articles
    const articlesRef = collection(db, "clubs", clubId, "articles")
    const articlesSnap = await getDocs(query(articlesRef, orderBy("year", "desc")))
    const articles = articlesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return {
      premierships,
      bestAndFairest,
      articles,
    }
  } catch (error) {
    console.error("Error fetching club records:", error)
    throw new Error("Failed to fetch club records")
  }
}

// Add premiership record
export async function addPremiership(clubId: string, premiership: any) {
  try {
    const premiershipsRef = collection(db, "clubs", clubId, "premierships")
    await addDoc(premiershipsRef, {
      ...premiership,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error adding premiership:", error)
    throw new Error("Failed to add premiership")
  }
}

// Add best & fairest record
export async function addBestAndFairest(clubId: string, award: any) {
  try {
    const bestAndFairestRef = collection(db, "clubs", clubId, "bestAndFairest")
    await addDoc(bestAndFairestRef, {
      ...award,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error adding best & fairest:", error)
    throw new Error("Failed to add best & fairest")
  }
}

// Add article record
export async function addArticle(clubId: string, article: any) {
  try {
    const articlesRef = collection(db, "clubs", clubId, "articles")
    await addDoc(articlesRef, {
      ...article,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error adding article:", error)
    throw new Error("Failed to add article")
  }
}

// Delete record from subcollection
export async function deleteRecord(clubId: string, collection: string, recordId: string) {
  try {
    const recordRef = doc(db, "clubs", clubId, collection, recordId)
    await deleteDoc(recordRef)
  } catch (error) {
    console.error("Error deleting record:", error)
    throw new Error("Failed to delete record")
  }
}
