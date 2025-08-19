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
    status: 'Pending activation',
    description: '',
    logoUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({})

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

  const validate = (v: ClientFormValues) => {
    const nextErrors: Partial<Record<keyof ClientFormValues, string>> = {}
    if (!v.firstName.trim()) nextErrors.firstName = 'First name is required'
    if (!v.lastName.trim()) nextErrors.lastName = 'Last name is required'
    if (!v.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) nextErrors.email = 'Enter a valid email'
    if (v.website && !/^https?:\/\//i.test(v.website)) nextErrors.website = 'Start with http:// or https://'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate(values)) {
      onSubmit(values)
    }
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            aria-invalid={!!errors.firstName}
            value={values.firstName}
            onChange={(e) => {
              const next = e.target.value
              setValues((s) => ({ ...s, firstName: next }))
              if (errors.firstName) setErrors((er) => ({ ...er, firstName: next.trim() ? '' : 'First name is required' }))
            }}
          />
          {errors.firstName ? <div className="mt-1 text-xs text-red-600">{errors.firstName}</div> : null}
        </div>
        <div>
          <Label>
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            aria-invalid={!!errors.lastName}
            value={values.lastName}
            onChange={(e) => {
              const next = e.target.value
              setValues((s) => ({ ...s, lastName: next }))
              if (errors.lastName) setErrors((er) => ({ ...er, lastName: next.trim() ? '' : 'Last name is required' }))
            }}
          />
          {errors.lastName ? <div className="mt-1 text-xs text-red-600">{errors.lastName}</div> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            required
            aria-invalid={!!errors.email}
            value={values.email}
            onChange={(e) => {
              const next = e.target.value
              setValues((s) => ({ ...s, email: next }))
              if (errors.email) setErrors((er) => ({
                ...er,
                email: !next.trim() ? 'Email is required' : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) ? '' : 'Enter a valid email'),
              }))
            }}
          />
          {errors.email ? <div className="mt-1 text-xs text-red-600">{errors.email}</div> : null}
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
          <Input
            aria-invalid={!!errors.website}
            value={values.website}
            onChange={(e) => {
              const next = e.target.value
              setValues((s) => ({ ...s, website: next }))
              if (errors.website) setErrors((er) => ({ ...er, website: next && /^https?:\/\//i.test(next) ? '' : 'Start with http:// or https://' }))
            }}
            placeholder="https://example.com"
          />
          {errors.website ? <div className="mt-1 text-xs text-red-600">{errors.website}</div> : null}
        </div>
        <div>
          <Label>
            Status <span className="text-red-500">*</span>
          </Label>
          <Select value={values.status} onValueChange={(v) => setValues((s) => ({ ...s, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending activation">Pending activation</SelectItem>
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
        <Button onClick={handleSubmit} disabled={!!submitting || uploading}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </div>
  )
}


