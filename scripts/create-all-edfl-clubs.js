import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore"

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

// Helper function to create URL-safe slugs
function createClubSlug(clubName) {
  return clubName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
}

// All EDFL clubs from 1930 to present
const allEdflClubs = [
  // Current clubs (active)
  { name: "Aberfeldie", current: true, founded: "1922", colors: "Red and Black", homeGround: "Aberfeldie Park" },
  { name: "Airport West", current: true, founded: "1965", colors: "Blue and Gold", homeGround: "Airport West Reserve" },
  {
    name: "Avondale Heights",
    current: true,
    founded: "1958",
    colors: "Navy and White",
    homeGround: "Avondale Heights Reserve",
  },
  {
    name: "Deer Park",
    current: true,
    founded: "1954",
    colors: "Gold and Brown",
    homeGround: "Deer Park Recreation Reserve",
  },
  { name: "East Keilor", current: true, founded: "1967", colors: "Green and Gold", homeGround: "East Keilor Reserve" },
  {
    name: "Essendon Doutta Stars",
    current: true,
    founded: "1990",
    colors: "Red and Black",
    homeGround: "Windy Hill Reserve",
  },
  { name: "Glenroy", current: true, founded: "1956", colors: "Blue and White", homeGround: "Glenroy Reserve" },
  {
    name: "Greenvale",
    current: true,
    founded: "1985",
    colors: "Blue and White",
    homeGround: "Greenvale Recreation Reserve",
  },
  { name: "Keilor", current: true, founded: "1930", colors: "Purple and Gold", homeGround: "Keilor Park" },
  {
    name: "Maribyrnong Park",
    current: true,
    founded: "1945",
    colors: "Maroon and Gold",
    homeGround: "Maribyrnong Park",
  },
  { name: "Northern Saints", current: true, founded: "1998", colors: "Red and White", homeGround: "Coburg City Oval" },
  { name: "Pascoe Vale", current: true, founded: "1952", colors: "Black and White", homeGround: "Pascoe Vale Park" },
  { name: "Strathmore", current: true, founded: "1948", colors: "Black and White", homeGround: "Strathmore Reserve" },
  { name: "West Coburg", current: true, founded: "1962", colors: "Blue and Gold", homeGround: "West Coburg Reserve" },

  // Historical clubs (no longer active)
  { name: "6th Melb. Scouts", current: false, founded: "1935", colors: "Brown and Gold", homeGround: "Various" },
  { name: "Aberfeldie Park", current: false, founded: "1920", colors: "Red and White", homeGround: "Aberfeldie Park" },
  { name: "All Nations Youth Club", current: false, founded: "1945", colors: "Multi-colored", homeGround: "Various" },
  { name: "Ascot Imperials", current: false, founded: "1932", colors: "Purple and Gold", homeGround: "Ascot Vale" },
  { name: "Ascot Presbyterians", current: false, founded: "1930", colors: "Blue and White", homeGround: "Ascot Vale" },
  { name: "Ascot Rovers", current: false, founded: "1928", colors: "Red and Black", homeGround: "Ascot Vale" },
  {
    name: "Ascot Rovers/Maribyrnong",
    current: false,
    founded: "1940",
    colors: "Red and Black",
    homeGround: "Ascot Vale",
  },
  { name: "Ascot United", current: false, founded: "1935", colors: "Blue and Red", homeGround: "Ascot Vale" },
  { name: "Ascot Vale", current: false, founded: "1925", colors: "Blue and Gold", homeGround: "Ascot Vale Park" },
  {
    name: "Ascot Vale Methodists",
    current: false,
    founded: "1930",
    colors: "Navy and White",
    homeGround: "Ascot Vale",
  },
  { name: "Ascot Vale Wanderers", current: false, founded: "1933", colors: "Green and Gold", homeGround: "Ascot Vale" },
  { name: "Ascot Vale West", current: false, founded: "1938", colors: "Red and White", homeGround: "Ascot Vale" },
  { name: "Ascot Youth Centre", current: false, founded: "1950", colors: "Blue and Yellow", homeGround: "Ascot Vale" },
  {
    name: "Australian National Airways",
    current: false,
    founded: "1945",
    colors: "Blue and White",
    homeGround: "Essendon Airport",
  },
  { name: "Batman", current: false, founded: "1955", colors: "Black and Yellow", homeGround: "Batman Park" },
  {
    name: "Broadmeadows",
    current: false,
    founded: "1960",
    colors: "Green and Gold",
    homeGround: "Broadmeadows Reserve",
  },
  { name: "Brunswick City", current: false, founded: "1935", colors: "Blue and White", homeGround: "Brunswick" },
  { name: "Brunswick Colts", current: false, founded: "1940", colors: "Navy and Gold", homeGround: "Brunswick" },
  {
    name: "Brunswick Presbyterians",
    current: false,
    founded: "1932",
    colors: "Blue and White",
    homeGround: "Brunswick",
  },
  {
    name: "Brunswick Sons of Soldiers",
    current: false,
    founded: "1920",
    colors: "Khaki and Blue",
    homeGround: "Brunswick",
  },
  { name: "Brunswick United", current: false, founded: "1945", colors: "Red and Blue", homeGround: "Brunswick" },
  { name: "Catholic Boys Club", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Various" },
  { name: "Coburg Amateurs", current: false, founded: "1925", colors: "Blue and White", homeGround: "Coburg" },
  { name: "Coburg Districts", current: false, founded: "1930", colors: "Green and Gold", homeGround: "Coburg" },
  { name: "Coburg Rovers", current: false, founded: "1928", colors: "Red and Black", homeGround: "Coburg" },
  { name: "Coburg Sons of Soldiers", current: false, founded: "1920", colors: "Khaki and Blue", homeGround: "Coburg" },
  { name: "Coburg Stars", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Coburg" },
  { name: "Coburgians", current: false, founded: "1940", colors: "Navy and White", homeGround: "Coburg" },
  { name: "Corpus Christi", current: false, founded: "1950", colors: "Blue and White", homeGround: "Various" },
  { name: "Craigieburn", current: false, founded: "1975", colors: "Green and Gold", homeGround: "Craigieburn Reserve" },
  { name: "Don Rovers", current: false, founded: "1945", colors: "Red and White", homeGround: "Various" },
  {
    name: "Doutta Stars",
    current: false,
    founded: "1954",
    colors: "Red and Black",
    homeGround: "Doutta Galla Reserve",
  },
  { name: "East Brunswick", current: false, founded: "1930", colors: "Blue and Gold", homeGround: "East Brunswick" },
  { name: "East Coburg", current: false, founded: "1935", colors: "Green and White", homeGround: "East Coburg" },
  { name: "East Essendon", current: false, founded: "1925", colors: "Red and Black", homeGround: "East Essendon" },
  { name: "Essendon All Blacks", current: false, founded: "1940", colors: "Black", homeGround: "Essendon" },
  { name: "Essendon Baptist", current: false, founded: "1935", colors: "Blue and White", homeGround: "Essendon" },
  {
    name: "Essendon Baptist St.Johns",
    current: false,
    founded: "1945",
    colors: "Blue and White",
    homeGround: "Essendon",
  },
  { name: "Essendon Bombers", current: false, founded: "1930", colors: "Red and Black", homeGround: "Windy Hill" },
  {
    name: "Essendon Church of Christ",
    current: false,
    founded: "1940",
    colors: "Blue and Gold",
    homeGround: "Essendon",
  },
  {
    name: "Essendon Grammar Old Boys",
    current: false,
    founded: "1925",
    colors: "Navy and Gold",
    homeGround: "Essendon Grammar",
  },
  {
    name: "Essendon High School Old Boys",
    current: false,
    founded: "1930",
    colors: "Blue and White",
    homeGround: "Essendon High",
  },
  { name: "Essendon Imperials", current: false, founded: "1935", colors: "Purple and Gold", homeGround: "Essendon" },
  {
    name: "Essendon Returned Soldiers",
    current: false,
    founded: "1920",
    colors: "Khaki and Blue",
    homeGround: "Essendon",
  },
  {
    name: "Essendon Sons of Soldiers",
    current: false,
    founded: "1920",
    colors: "Khaki and Blue",
    homeGround: "Essendon",
  },
  { name: "Essendon Stars", current: false, founded: "1940", colors: "Red and Gold", homeGround: "Essendon" },
  { name: "Essendon Swimmers Old", current: false, founded: "1935", colors: "Blue and White", homeGround: "Essendon" },
  { name: "Essendon Tullamarine", current: false, founded: "1960", colors: "Red and Black", homeGround: "Tullamarine" },
  { name: "Essendon United", current: false, founded: "1945", colors: "Red and Blue", homeGround: "Essendon" },
  { name: "Essendon Youth Centre", current: false, founded: "1950", colors: "Red and White", homeGround: "Essendon" },
  { name: "Fairbairn Rovers", current: false, founded: "1940", colors: "Green and Gold", homeGround: "Fairbairn Park" },
  {
    name: "Fairbairn Socials",
    current: false,
    founded: "1945",
    colors: "Blue and White",
    homeGround: "Fairbairn Park",
  },
  { name: "Fawkner Districts", current: false, founded: "1955", colors: "Red and Black", homeGround: "Fawkner" },
  { name: "Flemington/Kensington", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Flemington" },
  {
    name: "Footscray Technical College",
    current: false,
    founded: "1940",
    colors: "Navy and White",
    homeGround: "Footscray",
  },
  { name: "Ford Company", current: false, founded: "1950", colors: "Blue and White", homeGround: "Broadmeadows" },
  {
    name: "Gladstone Park",
    current: false,
    founded: "1970",
    colors: "Green and Gold",
    homeGround: "Gladstone Park Reserve",
  },
  { name: "Glenbervie", current: false, founded: "1945", colors: "Red and White", homeGround: "Glenbervie" },
  { name: "Hadfield", current: false, founded: "1960", colors: "Blue and Yellow", homeGround: "Hadfield Reserve" },
  { name: "Jacana", current: false, founded: "1965", colors: "Green and White", homeGround: "Jacana Reserve" },
  { name: "Keilor Park", current: false, founded: "1955", colors: "Purple and White", homeGround: "Keilor Park" },
  { name: "Keilor Regal Sports", current: false, founded: "1950", colors: "Blue and Gold", homeGround: "Keilor" },
  {
    name: "Kensington Methodists",
    current: false,
    founded: "1930",
    colors: "Blue and White",
    homeGround: "Kensington",
  },
  { name: "Knox Presbyterians", current: false, founded: "1935", colors: "Navy and Gold", homeGround: "Various" },
  { name: "La Mascotte", current: false, founded: "1940", colors: "Red and Blue", homeGround: "Various" },
  { name: "Lincoln Rovers", current: false, founded: "1935", colors: "Green and Gold", homeGround: "Lincoln Park" },
  { name: "Lincoln Stars", current: false, founded: "1940", colors: "Blue and White", homeGround: "Lincoln Park" },
  { name: "Lincoln Tigers", current: false, founded: "1945", colors: "Yellow and Black", homeGround: "Lincoln Park" },
  { name: "Maribyrnong", current: false, founded: "1930", colors: "Maroon and Gold", homeGround: "Maribyrnong" },
  {
    name: "Maribyrnong-Ascot United",
    current: false,
    founded: "1950",
    colors: "Blue and Red",
    homeGround: "Maribyrnong",
  },
  {
    name: "Maribyrnong Regal Sport",
    current: false,
    founded: "1945",
    colors: "Blue and Gold",
    homeGround: "Maribyrnong",
  },
  {
    name: "Maribyrnong Youth Club",
    current: false,
    founded: "1955",
    colors: "Red and White",
    homeGround: "Maribyrnong",
  },
  { name: "Marrows", current: false, founded: "1940", colors: "Green and White", homeGround: "Various" },
  {
    name: "Meadows Heights",
    current: false,
    founded: "1975",
    colors: "Blue and Yellow",
    homeGround: "Meadow Heights Reserve",
  },
  { name: "Monash Rovers", current: false, founded: "1960", colors: "Navy and Gold", homeGround: "Various" },
  { name: "Moonee Imps", current: false, founded: "1935", colors: "Purple and Gold", homeGround: "Moonee Ponds" },
  {
    name: "Moonee Ponds",
    current: false,
    founded: "1930",
    colors: "Blue and Gold",
    homeGround: "Moonee Ponds Reserve",
  },
  { name: "Moonee Ponds YCW", current: false, founded: "1945", colors: "Blue and White", homeGround: "Moonee Ponds" },
  { name: "Moonee Valley", current: false, founded: "1950", colors: "Green and Gold", homeGround: "Moonee Valley" },
  {
    name: "Moonee Valley Juniors",
    current: false,
    founded: "1955",
    colors: "Red and Blue",
    homeGround: "Moonee Valley",
  },
  { name: "North Coburg Saints", current: false, founded: "1960", colors: "Red and White", homeGround: "North Coburg" },
  {
    name: "North Essendon Methodists",
    current: false,
    founded: "1935",
    colors: "Blue and White",
    homeGround: "North Essendon",
  },
  { name: "Northcote Excelsior", current: false, founded: "1940", colors: "Green and Gold", homeGround: "Northcote" },
  { name: "Northern Juniors", current: false, founded: "1955", colors: "Blue and Yellow", homeGround: "Various" },
  { name: "Northern Rovers", current: false, founded: "1950", colors: "Red and Black", homeGround: "Various" },
  { name: "Oak Park", current: false, founded: "1965", colors: "Green and White", homeGround: "Oak Park Reserve" },
  { name: "Parkville", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Parkville" },
  { name: "Raeburn", current: false, founded: "1940", colors: "Red and White", homeGround: "Various" },
  { name: "Regal Sports", current: false, founded: "1945", colors: "Blue and Gold", homeGround: "Various" },
  { name: "Riverside Stars", current: false, founded: "1950", colors: "Blue and White", homeGround: "Various" },
  {
    name: "Roxburgh Park",
    current: false,
    founded: "1980",
    colors: "Green and Gold",
    homeGround: "Roxburgh Park Reserve",
  },
  { name: "Royal Park", current: false, founded: "1935", colors: "Purple and Gold", homeGround: "Royal Park" },
  {
    name: "South Kensington",
    current: false,
    founded: "1930",
    colors: "Blue and White",
    homeGround: "South Kensington",
  },
  { name: "St. Andrews", current: false, founded: "1940", colors: "Blue and White", homeGround: "Various" },
  { name: "St. Bernards", current: false, founded: "1935", colors: "Red and Blue", homeGround: "Various" },
  { name: "St. Bernards Juniors", current: false, founded: "1945", colors: "Red and Blue", homeGround: "Various" },
  { name: "St. Christophers", current: false, founded: "1940", colors: "Blue and Gold", homeGround: "Various" },
  { name: "St. Davids", current: false, founded: "1935", colors: "Navy and White", homeGround: "Various" },
  { name: "St. Francis", current: false, founded: "1940", colors: "Brown and Gold", homeGround: "Various" },
  { name: "St. Johns", current: false, founded: "1935", colors: "Blue and White", homeGround: "Various" },
  { name: "St. Monicas CYMS", current: false, founded: "1945", colors: "Blue and Gold", homeGround: "Various" },
  { name: "St. Olivers", current: false, founded: "1940", colors: "Green and White", homeGround: "Various" },
  { name: "St. Patricks", current: false, founded: "1935", colors: "Green and Gold", homeGround: "Various" },
  { name: "St. Pauls", current: false, founded: "1940", colors: "Blue and White", homeGround: "Various" },
  { name: "Strathmore Stars", current: false, founded: "1945", colors: "Blue and Gold", homeGround: "Strathmore" },
  {
    name: "Sydenham Hillside",
    current: false,
    founded: "1985",
    colors: "Green and Gold",
    homeGround: "Sydenham Reserve",
  },
  {
    name: "Taylors Lakes",
    current: false,
    founded: "1980",
    colors: "Blue and White",
    homeGround: "Taylors Lakes Reserve",
  },
  { name: "Tullamarine", current: false, founded: "1960", colors: "Red and Black", homeGround: "Tullamarine Reserve" },
  {
    name: "Tullamarine/Airport West",
    current: false,
    founded: "1965",
    colors: "Blue and Gold",
    homeGround: "Airport West",
  },
  {
    name: "Tullamarine Ascot Presbyterians",
    current: false,
    founded: "1955",
    colors: "Blue and White",
    homeGround: "Tullamarine",
  },
  { name: "Vespa", current: false, founded: "1950", colors: "Blue and Yellow", homeGround: "Various" },
  { name: "West Brunswick", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "West Brunswick" },
  {
    name: "West Brunswick Laurels",
    current: false,
    founded: "1940",
    colors: "Green and Gold",
    homeGround: "West Brunswick",
  },
  {
    name: "West Coburg Amateurs",
    current: false,
    founded: "1955",
    colors: "Blue and White",
    homeGround: "West Coburg",
  },
  {
    name: "West Coburg Juniors",
    current: false,
    founded: "1960",
    colors: "Blue and Yellow",
    homeGround: "West Coburg",
  },
  { name: "West Coburg Seniors", current: false, founded: "1958", colors: "Blue and Gold", homeGround: "West Coburg" },
  { name: "West Essendon", current: false, founded: "1930", colors: "Red and Black", homeGround: "West Essendon" },
  {
    name: "West Essendon Youth Center",
    current: false,
    founded: "1955",
    colors: "Red and White",
    homeGround: "West Essendon",
  },
  { name: "West Moreland", current: false, founded: "1945", colors: "Green and White", homeGround: "Various" },
  { name: "Westmeadows", current: false, founded: "1970", colors: "Blue and Gold", homeGround: "Westmeadows Reserve" },
  { name: "Woodlands", current: false, founded: "1965", colors: "Green and Gold", homeGround: "Woodlands Reserve" },
]

async function createAllEdflClubs() {
  console.log(`Creating all ${allEdflClubs.length} EDFL clubs...`)

  try {
    const clubsCollection = collection(db, "clubs")
    let addedCount = 0
    let skippedCount = 0

    for (const clubData of allEdflClubs) {
      const slug = createClubSlug(clubData.name)

      // Check if club already exists
      const existingQuery = query(clubsCollection, where("slug", "==", slug))
      const existingDocs = await getDocs(existingQuery)

      if (existingDocs.empty) {
        const club = {
          name: clubData.name,
          slug: slug,
          location: clubData.name.includes("St.") ? "Various" : clubData.name.split(" ")[0],
          description: clubData.current
            ? `${clubData.name} is one of the current clubs competing in the EDFL.`
            : `${clubData.name} was a historical club that competed in the EDFL.`,
          founded: clubData.founded || "Unknown",
          colors: clubData.colors || "Unknown",
          homeGround: clubData.homeGround || "Unknown",
          current: clubData.current,
          status: clubData.current ? "Active" : "Historical",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        console.log(`Adding ${club.name}...`)
        const docRef = await addDoc(clubsCollection, club)
        console.log(`✅ Added ${club.name} (${club.status}) with ID: ${docRef.id}`)
        addedCount++
      } else {
        console.log(`⏭️  Skipped ${clubData.name} (already exists)`)
        skippedCount++
      }
    }

    console.log(`\n🎉 COMPLETE!`)
    console.log(`✅ Added: ${addedCount} clubs`)
    console.log(`⏭️  Skipped: ${skippedCount} clubs (already existed)`)
    console.log(`📊 Total clubs in database: ${addedCount + skippedCount}`)

    // Summary by status
    const currentClubs = allEdflClubs.filter((c) => c.current).length
    const historicalClubs = allEdflClubs.filter((c) => !c.current).length
    console.log(`\n📈 BREAKDOWN:`)
    console.log(`🟢 Current clubs: ${currentClubs}`)
    console.log(`🔴 Historical clubs: ${historicalClubs}`)
  } catch (error) {
    console.error("❌ Error creating clubs:", error)
  }
}

// Run the script
createAllEdflClubs()
