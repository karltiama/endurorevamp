"use client"

import React, { ReactNode } from "react"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { GoalsProvider } from "@/components/goals/GoalsProvider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Target,
  Settings,
  LogOut,
  User,
  Home,
  TrendingUp,
  Activity,
  Calendar1
} from "lucide-react"
import { useAuth } from '@/providers/AuthProvider'

interface DashboardLayoutProps {
  children: ReactNode
  user: SupabaseUser
}

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        description: "Overview and key metrics"
      },
      {
        title: "Activities",
        url: "/dashboard/activities",
        icon: Activity,
        description: "Browse all your activities"
      },
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        description: "Detailed activity charts and insights"
      },
      {
        title: "Training Load",
        url: "/dashboard/training",
        icon: TrendingUp,
        description: "Training load and zone analysis"
      },
    ]
  },
  {
    title: "Planning",
    items: [
      {
        title: "Goals",
        url: "/dashboard/goals",
        icon: Target,
        description: "Set and track training goals"
      },
      {
        title: "Workout Planning",
        url: "/dashboard/planning",
        icon: Calendar1,
        description: "Smart workout recommendations and planning"
      },
    ]
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
        description: "App settings and integrations"
      },
      {
        title: "Profile",
        url: "/dashboard/settings/profile",
        icon: User,
        description: "User profile and preferences"
      },
    ]
  },
]

function AppSidebar() {
  const pathname = usePathname()
  const { signOut, isLoading } = useAuth()

  return (
    <Sidebar variant="sidebar" collapsible="hover" className="h-screen top-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <TrendingUp className="size-4" />
                <span className="truncate font-semibold">
                  EnduroRevamp
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-y-auto">
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                      >
                        <Link href={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              disabled={isLoading}
            >
              <LogOut className="size-4" />
              <span>{isLoading ? 'Signing out...' : 'Logout'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <GoalsProvider>
        <div className="flex min-h-screen w-full relative">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen relative">
            {/* Header with sidebar trigger */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-20 relative">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <div className="flex-1" />
            </header>
            
            {/* Main content */}
            <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 bg-background relative z-10">
              {children}
            </div>
          </main>
        </div>
      </GoalsProvider>
    </SidebarProvider>
  )
} 