'use client'

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  useSidebar 
} from '@/components/ui/sidebar'
import { Home, Settings, BarChart3 } from 'lucide-react'

function StateIndicator() {
  const { state, isHovered } = useSidebar()
  
  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg z-50">
      <div className="text-sm font-mono">
        <div>State: <span className="text-yellow-300">{state}</span></div>
        <div>Hovered: <span className="text-blue-300">{isHovered ? 'true' : 'false'}</span></div>
      </div>
    </div>
  )
}

export default function TestHoverSidebarPage() {
  return (
    <div className="min-h-screen">
      <SidebarProvider defaultOpen={false}>
        <StateIndicator />
        <div className="flex min-h-screen w-full">
          <Sidebar variant="inset" collapsible="hover">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Dashboard">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Analytics">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Settings">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Hover Sidebar Test</h1>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>The sidebar should start in collapsed mode (showing only icons)</li>
                  <li>When you hover over the sidebar, it should expand horizontally over this content</li>
                  <li>The main content should NOT shift - the sidebar overlays on top</li>
                  <li>When you move your mouse away, it should collapse back to icon-only mode</li>
                </ol>
                
                <div className="mt-6 p-4 bg-gray-100 rounded">
                  <h3 className="font-medium mb-2">Expected Behavior:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Sidebar starts collapsed (icon width: 3rem / 48px)</li>
                    <li>On hover: Expands to full width (16rem / 256px) as an overlay</li>
                    <li>Text labels appear (no group headings)</li>
                    <li>Main content stays in place (doesn&apos;t shift right)</li>
                    <li>Smooth transition animation</li>
                    <li>On mouse leave: Collapses back to icon width</li>
                    <li>Text labels hide</li>
                    <li>Higher z-index ensures sidebar appears over content</li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
} 