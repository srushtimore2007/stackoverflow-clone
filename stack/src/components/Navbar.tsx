"use client";

import { useAuth } from "../lib/AuthContext";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useRouter } from "next/navigation";

const Navbar = ({ handleslidein }: any) => {
  const { user, logout } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handlelogout = () => {
    logout();
    router.push("/auth/login"); // ✅ redirect after logout
  };

  return (
    <div className="top-0 z-50 w-full min-h-[53px] bg-white border-t-[3px] border-[#ef8236] shadow-[0_1px_5px_#00000033] flex items-center justify-center">
      <div className="w-[90%] max-w-[1440px] flex items-center justify-between mx-auto py-1">
        
        {/* Sidebar Button */}
        <button
          aria-label="Toggle sidebar"
          className="sm:block md:hidden p-2 rounded hover:bg-gray-100 transition"
          onClick={handleslidein}
        >
          <Menu className="w-5 h-5 text-gray-800" />
        </button>

        {/* Left */}
        <div className="flex items-center gap-2 flex-grow">
          <Link href="/" className="px-3 py-1">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
          </Link>

          <div className="hidden sm:flex gap-1">
            {["About", "Products", "For Teams"].map((item) => (
              <Link
                key={item}
                href="/"
                className="text-sm text-[#454545] font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Search */}
          <form className="hidden lg:block flex-grow relative px-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-[600px] pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-600" />
          </form>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher userEmail={user?.email} />

          {!hasMounted ? null : !user ? (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-4 py-1.5 rounded transition"
              >
                Log in
              </Link>

              <Link
                href="/signup/signup"
                className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 px-4 py-1.5 rounded transition"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              {/* Profile */}
              <Link
                href={`/users/${user._id}`}
                className="flex items-center justify-center bg-orange-600 text-white text-sm font-semibold w-9 h-9 rounded-full"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>

              {/* Logout */}
              <button
                onClick={handlelogout}
                className="text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-4 py-1.5 rounded transition"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
