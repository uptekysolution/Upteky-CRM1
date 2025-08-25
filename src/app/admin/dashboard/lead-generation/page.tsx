
'use client';

import { LeadGenerationGuard } from '@/components/lead-generation-guard';
import { LeadsStudio } from '@/components/leads-studio';

export default function LeadGenerationPage() {
    return (
    <LeadGenerationGuard>
      <LeadsStudio />
    </LeadGenerationGuard>
  );
}
