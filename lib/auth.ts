import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, type User } from "firebase/auth"
import { initializeFirebase } from "./firebase"
import { doc, getDoc, getFirestore } from "firebase/firestore"
import { useAuth as useAuthFromContext } from "@/contexts/AuthContext"

// Initialize Firebase
initializeFirebase()

// Export the useAuth hook from the context
export const useAuth = useAuthFromContext

// Get the current user
export const getCurrentUser = (): User | null => {
  const auth = getAuth()
  return auth.currentUser
}

// Get the auth instance
export const getAuthInstance = () => {
  return getAuth()
}

// Check if a user is an admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const db = getFirestore()
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.isAdmin === true
    }

    return false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Check if a user is a guest
export const isGuestUser = (user: User | null): boolean => {
  if (!user) return true

  // Check if the user is anonymous or has a specific email domain for guest accounts
  return user.isAnonymous || (user.email && user.email.includes("@guest.edfl.com"))
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const auth = getAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

// Sign out
export const signOutUser = async () => {
  const auth = getAuth()
  return signOut(auth)
}

// Create a new user
export const createUser = async (email: string, password: string) => {
  const auth = getAuth()
  return createUserWithEmailAndPassword(auth, email, password)
}
