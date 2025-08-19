import type { NextApiRequest, NextApiResponse } from 'next'
import { db, auth } from '@/lib/firebase-admin'
import nodemailer from 'nodemailer'

type Data = {
  message?: string
  client?: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone = '',
      position = '',
      industry = '',
      website = '',
      status: _statusIgnored,
      description = '',
      logoUrl = '',
    } = req.body || {}

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'firstName, lastName and email are required' })
    }

    // 1) Create Firebase Auth user (or fetch if exists)
    let userRecord
    try {
      userRecord = await auth.createUser({
        email: String(email).trim(),
        displayName: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        emailVerified: false,
        disabled: false,
      })
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(String(email).trim())
      } else {
        throw err
      }
    }

    const now = new Date()
    const name = `${String(firstName).trim()} ${String(lastName).trim()}`.trim()

    // 2) Save client metadata to Firestore with Pending activation status
    const clientDoc = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      name,
      nameLower: name.toLowerCase(),
      email: String(email).trim(),
      phone,
      position,
      industry,
      website,
      status: 'Pending activation',
      description,
      logoUrl,
      authUid: userRecord.uid,
      projectsCount: 0,
      lastContactAt: null as Date | null,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection('clients').add(clientDoc)

    // 3) Generate password reset link with continue URL to /login
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'
    const resetLink = await auth.generatePasswordResetLink(String(email).trim(), {
      url: `${appUrl}/login`,
      handleCodeInApp: false,
    })

    // 4) Send welcome email with Nodemailer
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string }
        : undefined,
    })

    const html = buildWelcomeEmailHtml(String(firstName).trim(), resetLink)

    const smtpUser = (process.env.SMTP_USER || '') as string
    const brandedFrom = (process.env.SMTP_FROM || '') as string
    const fromAddress = smtpUser || brandedFrom || 'no-reply@localhost'

    await transport.sendMail({
      from: fromAddress,
      sender: smtpUser || undefined,
      replyTo: brandedFrom && brandedFrom !== fromAddress ? brandedFrom : undefined,
      envelope: { from: smtpUser || fromAddress, to: String(email).trim() },
      to: String(email).trim(),
      subject: 'Welcome to Upteky Solution Pvt Ltd – Your Account is Ready!',
      html,
    })

    return res.status(201).json({
      message: 'Client created and email sent',
      client: { id: docRef.id, ...clientDoc },
    })
  } catch (error: any) {
    console.error('addClient error', error)
    return res.status(500).json({ message: error?.message || 'Internal Server Error' })
  }
}

function buildWelcomeEmailHtml(firstName: string, resetLink: string): string {
  const safeName = firstName || 'there'
  return `
  <div style="font-family:Arial,Helvetica,sans-serif; color:#111;">
    <h2 style="margin-bottom:16px;">Welcome to Upteky Solution Pvt Ltd!</h2>
    <p>Hi ${safeName},</p>
    <p>Welcome to Upteky Solution Pvt Ltd! We're excited to have you on board.</p>
    <p>With your new account, you can:</p>
    <ul>
      <li>Access your project dashboard</li>
      <li>Submit and manage support tickets</li>
      <li>Track project progress and milestones</li>
      <li>Communicate with our team</li>
    </ul>
    <p style="margin:24px 0;">
      <a href="${resetLink}" style="background:#0ea5e9; color:#fff; padding:12px 18px; border-radius:6px; text-decoration:none; display:inline-block;">Set Your Password</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p style="margin-top:24px; color:#555;">This link will expire automatically. If it expires, you can request a new password reset from the login page.</p>
  </div>
  `
}


