"use client"
import React, { useState, useEffect } from 'react'
import { useUser } from '@/app/provider'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { User, Mail, ArrowLeft, Camera, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'

function ProfilePage() {
  const { user, setUser, loading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [picture, setPicture] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPicture(user.picture || '')
    }
  }, [user])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      // Update in Supabase users table
      const { error: dbError } = await supabase
        .from('Users')
        .update({ name: name, picture: picture })
        .eq('email', user.email)

      if (dbError) throw dbError

      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name, picture: picture }
      })

      if (authError) throw authError

      // Update local context
      setUser({ ...user, name, picture })
      
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4 hover:bg-gray-100">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-2">
            Edit Profile
          </Button>
        )}
      </div>

      <Card className="shadow-lg border-gray-200/60 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-8 pt-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative group">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md overflow-hidden">
                {isEditing ? (
                  picture ? (
                    <img src={picture} alt="Profile" className="w-24 h-24 object-cover" />
                  ) : (
                    <User className="w-10 h-10" />
                  )
                ) : user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-24 h-24 object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editing Profile' : (user?.name || 'User')}
              </CardTitle>
              <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-2">Member</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8 pb-8 px-6 md:px-10">
          <div className="space-y-4">
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Display Name
              </label>
              {isEditing ? (
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="rounded-xl border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 transition-all h-12"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 font-medium">
                  {user?.name || 'Not provided'}
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Email Address
              </label>
              <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed flex justify-between items-center">
                <span>{user?.email || 'Not provided'}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold">Read Only</span>
              </div>
            </div>

            {/* Picture URL (Only visible when editing) */}
            {isEditing && (
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Profile Picture URL
                </label>
                <Input 
                  value={picture} 
                  onChange={(e) => setPicture(e.target.value)} 
                  className="rounded-xl border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 transition-all h-12 text-sm"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500 font-medium ml-1">Provide a direct link to an image to update your avatar.</p>
              </div>
            )}
          </div>
        </CardContent>
        {isEditing && (
          <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false)
                setName(user?.name || '')
                setPicture(user?.picture || '')
              }}
              disabled={isSaving}
              className="rounded-xl border-2 hover:bg-gray-100 font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200 gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default ProfilePage
