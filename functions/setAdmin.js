const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json") // You'll need to download this from Firebase console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// The email of the user you want to make an admin
const email = "airportwestfc2019@gmail.com"

async function setAdminRole() {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email)

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    })

    console.log(`Successfully set admin role for ${email}`)
  } catch (error) {
    console.error("Error setting admin role:", error)
  }
}

setAdminRole()
