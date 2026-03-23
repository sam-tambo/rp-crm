import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency = 'EUR'): string {
  if (value == null) return '€0'
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}
