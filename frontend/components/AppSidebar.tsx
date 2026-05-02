import * as React from "react"
import { useLocation } from "react-router-dom"
import {
  IconLayoutDashboard,
  IconPackage,
  IconTarget,
  IconUsers,
  IconSettings,
  IconActivityHeartbeat,
  IconBolt,
  IconFileText,
  IconUser,
  IconLogout,
  IconNetwork,
  IconLayoutKanban,
  IconUserCheck,
} from "@tabler/icons-react"

import { NavLink } from "@/components/NavLink"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: string;
  onLogout?: () => void;
}

const navEmployee = [
  {
    title: "Profile",
    url: "/employee/profile",
    icon: IconUser,
    roles: ["employee"],
  },
  {
    title: "Settings",
    url: "/employee/settings",
    icon: IconSettings,
    roles: ["employee"],
  },
]

const navHR = [
  {
    title: "NEXUS MAP",
    url: "/hr/dashboard",
    icon: IconNetwork,
    roles: ["hr"],
  },
  {
    title: "EMPLOYEES",
    url: "/hr/employees",
    icon: IconUsers,
    roles: ["hr"],
  },
  {
    title: "PROJECTS",
    url: "/hr/projects",
    icon: IconLayoutKanban,
    roles: ["hr"],
  },
  {
    title: "ACTION CENTER",
    url: "/hr/team-requests",
    icon: IconUserCheck,
    roles: ["hr"],
  },
  {
    title: "BURNOUT RADAR",
    url: "/hr/burnout",
    icon: IconActivityHeartbeat,
    roles: ["hr"],
  },
  {
    title: "SKILL PULSE",
    url: "/hr/skills",
    icon: IconBolt,
    roles: ["hr"],
  },
  {
    title: "AUDIT LOG",
    url: "/hr/audit",
    icon: IconFileText,
    roles: ["hr"],
  },
  {
    title: "SETTINGS",
    url: "/hr/settings",
    icon: IconSettings,
    roles: ["hr"],
  },
]

const navManager = [
  {
    title: "NEXUS MAP",
    url: "/manager/dashboard",
    icon: IconLayoutDashboard,
    roles: ["manager"],
  },
  {
    title: "MATCHING ENGINE",
    url: "/manager/match",
    icon: IconTarget,
    roles: ["manager"],
  },
  {
    title: "MY TEAMS",
    url: "/manager/team",
    icon: IconUsers,
    roles: ["manager"],
  },
  {
    title: "BURNOUT RADAR",
    url: "/manager/burnout",
    icon: IconActivityHeartbeat,
    roles: ["manager"],
  },
  {
    title: "SKILL PULSE",
    url: "/manager/skills",
    icon: IconBolt,
    roles: ["manager"],
  },
  {
    title: "SETTINGS",
    url: "/manager/settings",
    icon: IconSettings,
    roles: ["manager"],
  },
]

export function AppSidebar({
  userRole = "",
  onLogout,
  ...props
}: AppSidebarProps) {
  const location = useLocation()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  const isActive = (url: string) => location.pathname === url

  const filterByRole = (items: Array<any>) => {
    return items.filter((item) => item.roles.includes(userRole))
  }

  const filteredNav =
    userRole === "employee"
      ? filterByRole(navEmployee)
      : userRole === "hr"
        ? filterByRole(navHR)
        : userRole === "manager"
          ? filterByRole(navManager)
          : []

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between w-full px-2">
          <button
            onClick={collapsed ? toggleSidebar : undefined}
            className={`flex items-center gap-2 ${
              collapsed ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconPackage className="size-5" />
            </div>
            {!collapsed && <span className="text-lg font-semibold">NEXUS</span>}
          </button>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="size-7"
              aria-label="Hide sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="size-4"
              >
                <path
                  fill="currentColor"
                  d="M19.25 7A2.25 2.25 0 0 0 17 4.75H7A2.25 2.25 0 0 0 4.75 7v10A2.25 2.25 0 0 0 7 19.25h10A2.25 2.25 0 0 0 19.25 17zm-12 9V8a.75.75 0 0 1 1.5 0v8a.75.75 0 0 1-1.5 0m13.5 1A3.75 3.75 0 0 1 17 20.75H7A3.75 3.75 0 0 1 3.25 17V7A3.75 3.75 0 0 1 7 3.25h10A3.75 3.75 0 0 1 20.75 7z"
                />
              </svg>
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {/* Navigation */}
        {filteredNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLogout}
                  tooltip="Logout"
                  className="text-destructive hover:text-destructive"
                >
                  <IconLogout className="size-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
