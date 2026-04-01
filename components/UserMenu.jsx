"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'
import { User, LogOut } from 'lucide-react'

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const menuRef = useRef(null)
  const { user } = useUser()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    localStorage.removeItem("token")
    await supabase.auth.signOut()
    router.replace("/auth")
    router.refresh()
  }

  const handleProfile = () => {
    setIsOpen(false)
    router.push("/profile")
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
        aria-label="User menu"
      >
        {user?.picture ? (
          <img 
            src={user.picture} 
            alt="Profile" 
            className="w-10 h-10 object-cover"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info */}
          {user && (
            <>
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </>
          )}
          <button
            onClick={handleProfile}
            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="w-4 h-4 mr-3 text-gray-500" />
            Profile
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
