/**
 * Inventory Layout — Unified layout with AppSidebar + SharedTopbar
 * Uses the new UI components for inventory management system
 */
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { SharedTopbar } from '@/components/SharedTopbar'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  onLogout: () => void
}

export function InventoryLayout({ onLogout }: Props) {
  const { user } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  const handleLogout = () => {
    onLogout()
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <SharedTopbar
            brandLink="/"
            brandTitle="INVT"
            showSuperAdminBadge={user?.role === 'admin'}
            showSearch={true}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            unreadCount={0}
            notificationsLink="/notifications"
            initials={getInitials(user?.email || 'User')}
            userName={user?.name}
            userJobTitle={user?.jobTitle}
            profileLink="/settings"
            onLogout={handleLogout}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default InventoryLayout
