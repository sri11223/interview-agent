"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboardIcon, History, BarChart3, Settings, GraduationCap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Define sidebar options locally to avoid import issues
const SideBarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    path: '/dashboard'
  },
  {
    name: 'My History',
    icon: History,
    path: '/scheduled-interview'
  },
  {
    name: 'All Practice',
    icon: GraduationCap,
    path: '/dashboard/all-interview'
  },
  {
    name: 'Progress',
    icon: BarChart3,
    path: '/billing'
  },
]

export function AppSidebar() {

  const path=usePathname()
  console.log(path);
  return (
    <Sidebar className="border-r-2 border-gray-100 bg-white">
      <SidebarHeader className='flex flex-col items-start px-6 pt-8 pb-6 space-y-6'>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">PrepAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {SideBarOptions.map((option, index) => {
                const isActive = path === option.path;
                return (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild className={`p-6 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 ring-1 ring-blue-100 shadow-sm' : 'hover:bg-gray-50 hover:text-gray-900 text-gray-500'}`}>
                      <Link href={option.path} className="flex items-center gap-4">
                        <option.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-base font-semibold ${isActive ? 'text-blue-700' : ''}`}>
                          {option.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-gray-100 mt-auto">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-bold text-gray-900">PrepAI</div>
          <div className="text-xs font-medium text-gray-400">
            Interview Practice Platform
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}