"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, UserPlus, Shield, ShieldAlert, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

interface User {
  id: string
  username: string
  email: string
  displayName: string
  isAdmin: boolean
  createdAt: string
  lastLogin: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const usersCollection = collection(db, "users")
      const userSnapshot = await getDocs(usersCollection)
      const userList: User[] = []

      userSnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, "id">
        userList.push({
          id: doc.id,
          username: userData.username || "",
          email: userData.email || "",
          displayName: userData.displayName || userData.username || "",
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          lastLogin: userData.lastLogin || new Date().toISOString(),
        })
      })

      setUsers(userList)
      setFilteredUsers(userList)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async () => {
    if (!selectedUser) return

    try {
      setProcessingAction(true)

      // Update user in Firestore
      const userRef = doc(db, "users", selectedUser.id)
      await updateDoc(userRef, {
        isAdmin: !selectedUser.isAdmin,
      })

      // In a real implementation, you would also update the custom claims
      // using Firebase Admin SDK via a Cloud Function

      // Update local state
      const updatedUsers = users.map((user) =>
        user.id === selectedUser.id ? { ...user, isAdmin: !selectedUser.isAdmin } : user,
      )

      setUsers(updatedUsers)
      setFilteredUsers(
        updatedUsers.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${selectedUser.displayName} is ${!selectedUser.isAdmin ? "now" : "no longer"} an admin.`,
      })
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setProcessingAction(true)

      // Delete user from Firestore
      await deleteDoc(doc(db, "users", selectedUser.id))

      // In a real implementation, you would also delete the user from Firebase Auth
      // using Firebase Admin SDK via a Cloud Function

      // Update local state
      const updatedUsers = users.filter((user) => user.id !== selectedUser.id)
      setUsers(updatedUsers)
      setFilteredUsers(
        updatedUsers.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${selectedUser.displayName} has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Error",
        description: "Username and password are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessingAction(true)

      // Check if username already exists
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", newUser.username))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        toast({
          title: "Error",
          description: "Username already exists.",
          variant: "destructive",
        })
        setProcessingAction(false)
        return
      }

      // In a real implementation, you would create the user in Firebase Auth
      // and then add them to Firestore using Firebase Admin SDK via a Cloud Function

      // For now, we'll just add them to Firestore with a dummy ID
      const newUserId = `user_${Date.now()}`
      const email = `${newUser.username}@edfl.fantasy.com`

      const newUserData = {
        username: newUser.username,
        email: email,
        displayName: newUser.username,
        isAdmin: newUser.isAdmin,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      // Add user to Firestore
      await setDoc(doc(db, "users", newUserId), newUserData)

      // Update local state
      const updatedUsers = [...users, { id: newUserId, ...newUserData }]
      setUsers(updatedUsers)
      setFilteredUsers(
        updatedUsers.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `User ${newUser.username} has been created.`,
      })

      // Reset form
      setNewUser({
        username: "",
        password: "",
        isAdmin: false,
      })

      setIsAddUserDialogOpen(false)
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchUsers}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.isAdmin ? (
                            <>
                              <ShieldAlert className="h-4 w-4 text-red-500 mr-1" />
                              <span>Admin</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 text-gray-500 mr-1" />
                              <span>User</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(user.lastLogin).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsRoleDialogOpen(true)
                          }}
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.displayName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              {selectedUser?.isAdmin
                ? `Remove admin privileges from ${selectedUser?.displayName}?`
                : `Make ${selectedUser?.displayName} an admin? This will grant them full access to the admin dashboard.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleToggleAdmin} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : selectedUser?.isAdmin ? (
                "Remove Admin"
              ) : (
                "Make Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will be able to log in with their username and password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isAdmin">Admin user</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
