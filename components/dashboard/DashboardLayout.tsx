"use client"

import { ReactNode } from "react"
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
  Dumbbell,
} from "lucide-react"

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
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Activity Analysis",
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
        icon: Dumbbell,
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

  return (
    <Sidebar variant="inset" collapsible="hover">
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
      
      <SidebarContent>
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
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                const form = document.createElement('form')
                form.method = 'post'
                form.action = '/auth/logout'
                document.body.appendChild(form)
                form.submit()
              }}
            >
              <LogOut className="size-4" />
              <span>Logout</span>
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
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Header with sidebar trigger */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <div className="flex-1" />
            </header>
            
            {/* Main content */}
            <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </GoalsProvider>
    </SidebarProvider>
  )
} 