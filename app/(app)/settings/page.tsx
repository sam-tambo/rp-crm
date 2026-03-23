import TopBar from '@/components/layout/TopBar'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" breadcrumb={[{ label: 'Settings' }]} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Settings size={40} style={{ color: '#D4E8DC' }} />
        <p className="text-sm" style={{ color: '#8aaa98' }}>Settings coming soon</p>
      </div>
    </div>
  )
}
