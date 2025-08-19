'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { storage } from '@/lib/firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

export interface ClientFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  industry: string
  website: string
  status: string
  description: string
  logoUrl?: string
}

export function ClientForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<ClientFormValues>
  submitting?: boolean
  onSubmit: (values: ClientFormValues) => Promise<void> | void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ClientFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    industry: '',
    website: '',
    status: 'Active',
    description: '',
    logoUrl: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (initial) {
      setValues((v) => ({
        ...v,
        firstName: (initial.firstName ?? v.firstName) as string,
        lastName: (initial.lastName ?? v.lastName) as string,
        email: (initial.email ?? v.email) as string,
        phone: (initial.phone ?? v.phone) as string,
        position: (initial.position ?? v.position) as string,
        industry: (initial.industry ?? v.industry) as string,
        website: (initial.website ?? v.website) as string,
        status: (initial.status ?? v.status) as string,
        description: (initial.description ?? v.description) as string,
        logoUrl: (initial.logoUrl ?? v.logoUrl) as string,
      }))
    }
  }, [initial])

  const handleFile = async (f: File) => {
    setUploading(true)
    try {
      const path = `client-logos/${Date.now()}-${f.name}`
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, f)
      const url = await getDownloadURL(fileRef)
      setValues((s) => ({ ...s, logoUrl: url }))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input value={values.firstName} onChange={(e) => setValues((s) => ({ ...s, firstName: e.target.value }))} />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={values.lastName} onChange={(e) => setValues((s) => ({ ...s, lastName: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={values.email} onChange={(e) => setValues((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={values.phone} onChange={(e) => setValues((s) => ({ ...s, phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Position</Label>
          <Input value={values.position} onChange={(e) => setValues((s) => ({ ...s, position: e.target.value }))} />
        </div>
        <div>
          <Label>Industry</Label>
          <Select value={values.industry || 'none'} onValueChange={(v) => setValues((s) => ({ ...s, industry: v === 'none' ? '' : v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select industry</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Website</Label>
          <Input value={values.website} onChange={(e) => setValues((s) => ({ ...s, website: e.target.value }))} placeholder="https://example.com" />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={values.status} onValueChange={(v) => setValues((s) => ({ ...s, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={values.description} onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
        </div>
        <div className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : values.logoUrl ? 'Uploaded' : 'Optional'}</div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={!!submitting}>Cancel</Button>
        <Button onClick={() => onSubmit(values)} disabled={!!submitting || uploading}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </div>
  )
}


