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

/**
 * Executes the access audit AI flow with the provided input.
 * @param {AccessAuditToolInput} input - The data for the access event to be analyzed.
 * @returns {Promise<AccessAuditToolOutput | { error: string }>} - The analysis result from the AI, or an error object if the process fails.
 */
export async function runAccessAudit(
  input: AccessAuditToolInput
): Promise<AccessAuditToolOutput | { error: string }> {
  try {
    // In a real app, you might add extra validation or logging here.
    // This is also where you would implement fine-grained permission checks before executing the flow.
    const result = await accessAuditTool(input);
    return result;
  } catch (e) {
    console.error("Error in runAccessAudit:", e);
    // Return a generic error to the client to avoid exposing sensitive implementation details.
    return { error: 'An unexpected error occurred while analyzing the access pattern.' };
  }
}
