// Access Audit Tool
'use server';
/**
 * @fileOverview This file defines the server-side logic for an AI-powered Access Audit Tool.
 * It acts as a secure, internal API endpoint for analyzing data access events.
 *
 * @description
 * The main function, `accessAuditTool`, takes details about a data access event and uses a
 * generative AI model to determine if the access is unusual or violates predefined security policies.
 * This is a core component of the application's security and audit infrastructure.
 *
 * For external integrations (e.g., Slack bots, third-party monitoring services) or mobile applications,
 * this flow would be wrapped by a dedicated, authenticated API endpoint (e.g., a REST endpoint in a Next.js route handler).
 * The Zod schemas ensure a clear and validated data contract for any client consuming this "endpoint".
 *
 * External API Design Considerations:
 * - Authentication: An API key, OAuth 2.0, or JWT-based authentication would be required.
 * - Rate Limiting: To prevent abuse and manage costs.
 * - Permissions: The API endpoint would need to verify that the calling service or user has the
 *   necessary permissions before invoking the flow.
 *
 * @exports accessAuditTool - The primary function to call the audit flow.
 * @exports AccessAuditToolInput - The Zod schema defining the input data contract.
 * @exports AccessAuditToolOutput - The Zod schema defining the output data contract.
 */

import {ai} from '@/ai/genkit';
import * as z from 'zod';

/**
 * @description Defines the data contract for the input of the access audit tool.
 * Any client or service calling this API must provide data matching this structure.
 */
const AccessAuditToolInputSchema = z.object({
  userRole: z.string().describe('The role of the user accessing the data (e.g., "Employee", "HR", "Admin").'),
  moduleAccessed: z.string().describe('The application module being accessed (e.g., "Payroll", "CRM").'),
  actionType: z.string().describe('The type of action being performed (e.g., "read", "write", "delete").'),
  dataAccessed: z.string().describe('A description of the specific data being accessed (e.g., "Viewing own salary slip", "Deleting customer contact").'),
  timestamp: z.string().datetime().describe('The ISO 8601 timestamp of when the event occurred.'),
});
export type AccessAuditToolInput = z.infer<typeof AccessAuditToolInputSchema>;

/**
 * @description Defines the data contract for the output of the access audit tool.
 * The AI's analysis will be returned in this format.
 */
const AccessAuditToolOutputSchema = z.object({
    isUnusual: z.boolean().describe('Whether the AI considers this access pattern to be unusual or a potential security risk.'),
    alertMessage: z.string().describe('A human-readable message explaining why the access is or is not considered unusual.'),
    severity: z.enum(["Low", "Medium", "High", "Critical"]).describe('The severity of the alert if the access is unusual.'),
    recommendation: z.string().describe('A recommended next step for a system administrator (e.g., "No action needed", "Review user permissions", "Investigate immediately").')
});
export type AccessAuditToolOutput = z.infer<typeof AccessAuditToolOutputSchema>;


/**
 * @description The main function that flags unusual data access or changes.
 * It serves as the entry point to the Genkit flow for auditing an access event.
 * @param {AccessAuditToolInput} input - The data for the access event to be audited.
 * @returns {Promise<AccessAuditToolOutput>} The result of the AI's analysis.
 */
export async function accessAuditTool(input: AccessAuditToolInput): Promise<AccessAuditToolOutput> {
  // In a real-world scenario, you might have a more complex flow,
  // potentially fetching user permission levels from a database via another tool.
  // Simple heuristic engine used as baseline and fallback when the LLM is unavailable
  function heuristicAnalysis(i: AccessAuditToolInput): AccessAuditToolOutput {
    const role = (i.userRole || '').toLowerCase();
    const mod = (i.moduleAccessed || '').toLowerCase();
    const action = (i.actionType || '').toLowerCase();
    const desc = (i.dataAccessed || '').toLowerCase();

    // Defaults
    let isUnusual = false;
    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    let alertMessage = 'No unusual pattern detected.';
    let recommendation = 'No action needed.';

    const criticalModules = ['permissions', 'user management'];
    const sensitiveModules = ['payroll', 'crm', 'attendance', ...criticalModules];
    const mentionsOthers = /(another|other|someone else|third party|not own|others)/i.test(desc);

    // Typical benign case: employee reading own data
    if (role === 'employee' && action === 'read' && mod === 'payroll' && !mentionsOthers) {
      return {
        isUnusual: false,
        alertMessage: 'Employee reading own payroll data appears normal.',
        severity: 'Low',
        recommendation: 'No action needed.'
      };
    }

    if (action === 'delete' && criticalModules.includes(mod)) {
      isUnusual = true;
      severity = 'Critical';
      alertMessage = 'Delete action on a critical module detected.';
      recommendation = 'Investigate immediately and review permission changes.';
    } else if ((action === 'delete' || action === 'update') && sensitiveModules.includes(mod)) {
      isUnusual = true;
      severity = 'High';
      alertMessage = 'Sensitive write operation detected.';
      recommendation = 'Review recent changes and confirm authorization.';
    } else if (role === 'employee' && sensitiveModules.includes(mod) && mentionsOthers) {
      isUnusual = true;
      severity = 'Medium';
      alertMessage = 'Employee appears to access data of another user.';
      recommendation = 'Verify if access aligns with policy for this user.';
    } else if (role === 'hr' && criticalModules.includes(mod) && (action === 'update' || action === 'delete')) {
      isUnusual = true;
      severity = 'High';
      alertMessage = 'HR modifying critical admin module.';
      recommendation = 'Validate approvals and change tickets.';
    }

    return { isUnusual, alertMessage, severity, recommendation };
  }

  const auditFlow = ai.defineFlow(
    {
      name: 'accessAuditFlow',
      inputSchema: AccessAuditToolInputSchema,
      outputSchema: AccessAuditToolOutputSchema,
    },
    async (input) => {
        const prompt = `
        You are an AI security analyst for a company's internal software. Your task is to audit a data access event and determine if it's unusual or violates security policies.

        Analyze the following event based on standard corporate security policies. General rules are:
        - Employees should only access their own data.
        - HR can access most employee data, but not Admin or Sub-Admin data.
        - Team Leads can view data for their direct reports but not edit sensitive information.
        - Admins and Sub-Admins have wide-ranging, but not unlimited, access. Accessing highly sensitive logs or changing core permissions should still be flagged.
        - Any 'delete' or 'update' action on critical data (like payroll or user permissions) outside of a normal workflow is highly suspicious.
        - Accessing data outside of normal business hours could be suspicious depending on the role and data.

        Event Details:
        - User Role: ${input.userRole}
        - Module Accessed: ${input.moduleAccessed}
        - Action Type: ${input.actionType}
        - Data Description: ${input.dataAccessed}
        - Timestamp: ${input.timestamp}

        Based on this, provide a JSON output with the following fields:
        - isUnusual: boolean
        - alertMessage: string
        - severity: "Low", "Medium", "High", or "Critical"
        - recommendation: string
      `;

      try {
        // Always compute a baseline first
        const baseline = heuristicAnalysis(input);
        // Use the default model configured in src/ai/genkit.ts
        const llmResponse: any = await ai.generate({
          prompt: prompt,
          output: {
              schema: AccessAuditToolOutputSchema
          }
        });

        // Support multiple Genkit response shapes
        if (typeof llmResponse?.output === 'function') {
          const out = llmResponse.output();
          if (out) return out;
        }
        if (typeof llmResponse?.text === 'function') {
          const text = await llmResponse.text();
          try {
            const parsed = JSON.parse(text);
            AccessAuditToolOutputSchema.parse(parsed);
            return parsed;
          } catch {}
        }
        if (typeof llmResponse?.outputText === 'function') {
          const text = await llmResponse.outputText();
          try {
            const parsed = JSON.parse(text);
            AccessAuditToolOutputSchema.parse(parsed);
            return parsed;
          } catch {}
        }
        // If we couldn't parse the LLM output, return baseline instead of error
        return baseline;
      } catch (err) {
        console.error('AI generation failed, falling back to rule-based analysis:', err);
        // Return heuristic baseline
        return heuristicAnalysis(input);
      }
    }
  );

  return await auditFlow(input);
}
