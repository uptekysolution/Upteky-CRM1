import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@/lib/firebase-admin'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' })
  const { email } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ message: 'Email is required' })

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'
    const resetLink = await auth.generatePasswordResetLink(email.trim(), {
      url: `${appUrl}/login`,
      handleCodeInApp: false,
    })

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string }
        : undefined,
    })

    const html = buildResetEmailHtml(resetLink)
    const smtpUser = (process.env.SMTP_USER || '') as string
    const brandedFrom = (process.env.SMTP_FROM || 'Upteky Solution Pvt Ltd <no-reply@upteky.com>') as string
    const fromAddress = smtpUser || brandedFrom

    await transport.sendMail({
      from: fromAddress,
      sender: smtpUser || undefined,
      replyTo: brandedFrom,
      envelope: { from: smtpUser || fromAddress, to: email.trim() },
      to: email.trim(),
      subject: 'Reset your Upteky Solution Pvt Ltd password',
      html,
    })

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    const code = e?.code || ''
    if (code === 'auth/user-not-found') return res.status(404).json({ message: 'No user found with this email' })
    if (code === 'auth/invalid-email') return res.status(400).json({ message: 'Enter a valid email address' })
    return res.status(500).json({ message: e?.message || 'Failed to send reset email' })
  }
}

function buildResetEmailHtml(link: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f9fc;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 10px rgba(17,24,39,0.06);overflow:hidden;">
          <tr>
            <td style="background:#0ea5e9;color:#fff;padding:20px 24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:18px;font-weight:700;">Upteky Solution Pvt Ltd</div>
              <div style="opacity:.9;font-size:12px;">Secure account access</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 4px 24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
              <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Reset your password</div>
              <div style="font-size:14px;line-height:1.6;color:#374151;">We received a request to reset your Upteky Solution Pvt Ltd password. Click the button below to set a new one.</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 24px 8px 24px;">
              <a href="${link}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;display:inline-block;">Set New Password</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;">
              If the button doesn’t work, copy and paste this link into your browser:<br/>
              <a href="${link}" style="color:#0ea5e9;word-break:break-all;">${link}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;">
              For your security, this link expires automatically. If it expires, you can request a new reset from the login page.
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;color:#6b7280;padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
              Need help? Contact our support team at <a style="color:#0ea5e9;text-decoration:none;" href="mailto:Hello@upteky.com">Hello@upteky.com</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `
}


