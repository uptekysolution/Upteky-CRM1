export interface ClientRecord {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  nameLower: string;
  email: string;
  phone: string;
  position: string;
  industry: string;
  website: string;
  status: 'Active' | 'Prospect' | 'Inactive' | string;
  description: string;
  logoUrl?: string;
  projectsCount?: number;
  lastContactAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ClientFilters {
  search?: string;
  status?: string;
  industry?: string;
  from?: string; // ISO date
}

function buildQuery(params?: ClientFilters) {
  const usp = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([k, v]) => {
    if (v) usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function listClients(params?: ClientFilters): Promise<ClientRecord[]> {
  const res = await fetch(`/api/internal/crm/clients${buildQuery(params)}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'Admin',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load clients');
  return await res.json();
}

export async function createClient(payload: Partial<ClientRecord>): Promise<ClientRecord> {
  const res = await fetch('/api/internal/crm/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'Admin',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create client');
  return await res.json();
}

export async function updateClient(id: string, payload: Partial<ClientRecord>): Promise<ClientRecord> {
  const res = await fetch(`/api/internal/crm/clients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'Admin',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update client');
  return await res.json();
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`/api/internal/crm/clients/${id}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': 'Admin',
    },
  });
  if (!res.ok) throw new Error('Failed to delete client');
}


