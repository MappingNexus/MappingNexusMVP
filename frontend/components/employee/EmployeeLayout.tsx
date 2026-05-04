/**
 * Employee Layout — Unified layout with AppSidebar + SharedTopbar
 */
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { SharedTopbar } from '@/components/SharedTopbar'
import type { UserProfile } from '@/types'

interface Props {
  user: UserProfile
  onLogout: () => void
}

const EmployeeLayout: React.FC<Props> = ({ user, onLogout }) => {
  const [searchValue, setSearchValue] = useState('')

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <AppSidebar userRole={user?.role} onLogout={onLogout} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <SharedTopbar
            brandLink="/"
            brandTitle="NEXUS"
            showSuperAdminBadge={user?.role === 'admin'}
            showSearch={true}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            unreadCount={0}
            notificationsLink="/notifications"
            initials={getInitials(user?.email || 'EM')}
            userName={user?.name || user?.companyName}
            userJobTitle={user?.role}
            profileLink="/employee/profile"
            onLogout={onLogout}
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

export default EmployeeLayout
