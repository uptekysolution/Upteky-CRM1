import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { idToken, role } = req.body || {}
  if (!idToken || !role) return res.status(400).json({ message: 'idToken and role required' })
  // Simple cookie passthrough of the client ID token; in production you should mint a session cookie
  res.setHeader('Set-Cookie', [
    `AuthToken=${idToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
    `UserRole=${encodeURIComponent(String(role))}; Path=/; SameSite=Lax; Max-Age=3600`,
  ])
  return res.status(200).json({ ok: true })
}


