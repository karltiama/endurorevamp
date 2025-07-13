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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  Calendar,
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
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
        description: "Training calendar and planning"
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
    ]
  },
]

function AppSidebar({ user }: { user: SupabaseUser }) {
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
                        tooltip={item.description}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User className="size-4" />
                  <span className="truncate font-semibold">Account</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action="/auth/logout" method="post" className="w-full">
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <GoalsProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar user={user} />
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