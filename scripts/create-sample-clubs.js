import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc } from "firebase/firestore"

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Sample EDFL clubs data
const sampleClubs = [
  {
    name: "Aberfeldie Jets",
    slug: "aberfeldie",
    location: "Aberfeldie",
    description: "Founded in 1922, the Aberfeldie Jets are one of the oldest clubs in the EDFL.",
    founded: "1922",
    colors: "Red and Black",
    homeGround: "Aberfeldie Park",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Airport West Eagles",
    slug: "airport-west",
    location: "Airport West",
    description: "The Eagles have been a competitive force in the EDFL for decades.",
    founded: "1965",
    colors: "Blue and Gold",
    homeGround: "Airport West Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Avondale Heights Sharks",
    slug: "avondale-heights",
    location: "Avondale Heights",
    description: "Known for their strong community spirit and competitive teams.",
    founded: "1958",
    colors: "Navy and White",
    homeGround: "Avondale Heights Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Deer Park Lions",
    slug: "deer-park",
    location: "Deer Park",
    description: "The Lions have a proud history of developing local talent.",
    founded: "1954",
    colors: "Gold and Brown",
    homeGround: "Deer Park Recreation Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "East Keilor Cougars",
    slug: "east-keilor",
    location: "East Keilor",
    description: "A club with a strong tradition of success across all grades.",
    founded: "1967",
    colors: "Green and Gold",
    homeGround: "East Keilor Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Essendon Doutta Stars",
    slug: "eds",
    location: "Essendon",
    description: "The merger of Essendon and Doutta Stars created this powerhouse club.",
    founded: "1990",
    colors: "Red and Black",
    homeGround: "Windy Hill Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Greenvale Kangaroos",
    slug: "greenvale",
    location: "Greenvale",
    description: "One of the newer clubs in the competition with growing success.",
    founded: "1985",
    colors: "Blue and White",
    homeGround: "Greenvale Recreation Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Keilor Thunder",
    slug: "keilor",
    location: "Keilor",
    description: "A foundation club of the EDFL with a rich history.",
    founded: "1930",
    colors: "Purple and Gold",
    homeGround: "Keilor Park",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Maribyrnong Park Lions",
    slug: "marby",
    location: "Maribyrnong",
    description: "Known for their strong junior development programs.",
    founded: "1945",
    colors: "Maroon and Gold",
    homeGround: "Maribyrnong Park",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Pascoe Vale Panthers",
    slug: "pascoe-vale",
    location: "Pascoe Vale",
    description: "The Panthers have been competitive across multiple divisions.",
    founded: "1952",
    colors: "Black and White",
    homeGround: "Pascoe Vale Park",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Strathmore Magpies",
    slug: "strathmore",
    location: "Strathmore",
    description: "A club with a proud tradition and strong community support.",
    founded: "1948",
    colors: "Black and White",
    homeGround: "Strathmore Reserve",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function createSampleClubs() {
  console.log("Creating sample EDFL clubs...")

  try {
    const clubsCollection = collection(db, "clubs")

    for (const club of sampleClubs) {
      console.log(`Adding ${club.name}...`)
      const docRef = await addDoc(clubsCollection, club)
      console.log(`✅ Added ${club.name} with ID: ${docRef.id}`)
    }

    console.log(`🎉 Successfully created ${sampleClubs.length} sample clubs!`)
  } catch (error) {
    console.error("❌ Error creating sample clubs:", error)
  }
}

// Run the script
createSampleClubs()
