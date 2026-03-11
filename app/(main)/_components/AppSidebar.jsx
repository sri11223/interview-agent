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
    <Sidebar>
      <SidebarHeader className='flex flex-col items-center pt-0 space-y-1'>
        <div className="flex items-center gap-2 py-2">
          <GraduationCap className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">PrepAI</span>
        </div>
        <Button className='w-full mt-1' asChild>
          <Link href="/dashboard/create-interview">
            <Plus />
            New Practice Session
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SideBarOptions.map((option, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild className={`p-5 ${path == option.path && 'bg-blue-50'}`}>
                    <Link href={option.path}>
                      <option.icon className="mr-2 h-4 w-4" />
                      <span className={`text-[16px] ${path == option.path && 'text-primary'}`}>
                        {option.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          PrepAI - Interview Practice Platform
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}