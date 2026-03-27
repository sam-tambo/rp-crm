import Sidebar from '@/components/layout/Sidebar'
import { WorkspaceProvider } from '@/lib/workspace-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#F4F4F8' }}>
        <Sidebar />
        <main className="flex-1 ml-60 overflow-y-auto flex flex-col">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  )
}
