import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/AppSidebar';
import UserMenu from '@/components/UserMenu';

function DashboardProvider({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className='w-full'>
        {/* Header with SidebarTrigger and UserMenu */}
        <header className='flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200'>
          <SidebarTrigger />
          <UserMenu />
        </header>
        {children}
      </div>
    </SidebarProvider>
  )
}

export default DashboardProvider
