import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0F' }}>
      <Sidebar />
      <main className="flex-1 ml-60 overflow-y-auto flex flex-col">
        {children}
      </main>
    </div>
  )
}
