'use server'

/**
 * @fileOverview This file defines a Next.js Server Action that serves as a secure wrapper for the Access Audit Tool AI flow.
 * @description
 * This action provides a clear separation between the client-side components and the server-side AI logic.
 * It is a key part of our internal API, ensuring that client components can securely trigger complex backend
 * processes without exposing the implementation details.
 *
 * Data contracts (input and output types) are imported directly from the flow definition, ensuring type safety
 * and consistency across the application. Any changes to the data schema in the flow will be reflected here,
 * preventing integration errors.
 *
 * This function handles calling the Genkit flow and includes error handling, making it a robust
 * "API endpoint" for our frontend.
 */

import { accessAuditTool, type AccessAuditToolInput, type AccessAuditToolOutput } from '@/ai/flows/access-audit-tool'
import { logUnusualAccess } from '@/lib/auditLogger'
import { auth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

/**
 * Executes the access audit AI flow with the provided input and logs the event.
 * @param {AccessAuditToolInput} input - The data for the access event to be analyzed.
 * @returns {Promise<AccessAuditToolOutput | { error: string }>} - The analysis result from the AI, or an error object if the process fails.
 */
export async function runAccessAudit(
  input: AccessAuditToolInput
): Promise<AccessAuditToolOutput | { error: string }> {
  try {
    // Get current user information from cookies
    const cookieStore = await cookies()
    const authToken = cookieStore.get('AuthToken')?.value
    const userRole = cookieStore.get('UserRole')?.value

    if (!authToken) {
      return { error: 'Authentication required' }
    }

    // Verify the user token
    const decodedToken = await auth.verifyIdToken(authToken)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email || 'unknown'

    // Run AI analysis
    const result = await accessAuditTool(input)

    // Log the audit event
    try {
      await logUnusualAccess(
        userId,
        userEmail,
        userRole || 'Unknown',
        input.actionType as any,
        input.moduleAccessed,
        input.dataAccessed,
        result.isUnusual ? result.severity.toLowerCase() as any : 'low',
        `${result.alertMessage} - ${result.recommendation}`,
        {
          aiAnalysis: result,
          originalInput: input,
        }
      )
    } catch (logError) {
      console.error('Failed to log audit event:', logError)
      // Don't fail the entire operation if logging fails
    }

    return result
  } catch (e) {
    console.error("Error in runAccessAudit:", e)
    return { error: 'An unexpected error occurred while analyzing the access pattern.' }
  }
}
