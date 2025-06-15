import Link from "next/link"

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-lg font-bold">
          My App
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-gray-300 hover:text-white">
            Home
          </Link>
          <Link href="/clubs" className="text-gray-300 hover:text-white">
            Clubs
          </Link>
          <Link href="/league-history" className="text-gray-300 hover:text-white">
            League History
          </Link>
          <Link href="/about" className="text-gray-300 hover:text-white">
            About
          </Link>
          <Link href="/test-value" className="text-gray-300 hover:text-white">
            Test Values
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
