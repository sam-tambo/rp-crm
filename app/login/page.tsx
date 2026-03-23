'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      router.push('/companies')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1aaa5e' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 6V10L8 14L2 10V6L8 2Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="text-xl font-semibold" style={{ color: '#191D25' }}>RP CRM</span>
          </div>
          <p className="text-sm" style={{ color: '#638070' }}>Revenue Precision</p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-8" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
          <h1 className="text-lg font-semibold mb-6" style={{ color: '#191D25' }}>Sign in to your account</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#638070' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 text-sm rounded-md outline-none transition-all"
                style={{
                  background: '#EEF7F2',
                  border: '1px solid #D4E8DC',
                  color: '#191D25',
                }}
                onFocus={e => e.target.style.borderColor = '#1aaa5e'}
                onBlur={e => e.target.style.borderColor = '#D4E8DC'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#638070' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-md outline-none transition-all"
                style={{
                  background: '#EEF7F2',
                  border: '1px solid #D4E8DC',
                  color: '#191D25',
                }}
                onFocus={e => e.target.style.borderColor = '#1aaa5e'}
                onBlur={e => e.target.style.borderColor = '#D4E8DC'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium transition-all mt-2"
              style={{
                background: loading ? '#157a46' : '#1aaa5e',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: '#8aaa98' }}>
          Contact your admin to create an account
        </p>
      </div>
    </div>
  )
}
