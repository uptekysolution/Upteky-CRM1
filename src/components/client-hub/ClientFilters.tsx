'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Search } from 'lucide-react'

export interface FilterState {
  search: string
  status: string
  industry: string
  from: string
}

export function ClientFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const [local, setLocal] = useState<FilterState>(value)

  useEffect(() => setLocal(value), [value])

  useEffect(() => {
    const id = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(id)
  }, [local, onChange])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-8"
          value={local.search}
          onChange={(e) => setLocal((s) => ({ ...s, search: e.target.value }))}
        />
      </div>
      <Select value={local.status || 'all'} onValueChange={(v) => setLocal((s) => ({ ...s, status: v === 'all' ? '' : v }))}>
        <SelectTrigger>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Prospect">Prospect</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={local.industry || 'all'} onValueChange={(v) => setLocal((s) => ({ ...s, industry: v === 'all' ? '' : v }))}>
        <SelectTrigger>
          <SelectValue placeholder="All Industries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Industries</SelectItem>
          <SelectItem value="IT">IT</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="Healthcare">Healthcare</SelectItem>
          <SelectItem value="Education">Education</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative">
        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          className="pl-8"
          value={local.from}
          onChange={(e) => setLocal((s) => ({ ...s, from: e.target.value }))}
        />
      </div>
    </div>
  )
}


