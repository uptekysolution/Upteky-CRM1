import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-6', className)}
      {...props}
    >
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M6.34 6.34l1.42 1.42" />
      <path d="M16.24 16.24l1.42 1.42" />
      <path d="M6.34 17.66l1.42-1.42" />
      <path d="M16.24 7.76l1.42-1.42" />
      <path d="M4 12a8 8 0 0 1 8-8" />
      <path d="M12 4a8 8 0 0 1 8 8" />
      <path d="M20 12a8 8 0 0 1-8 8" />
      <path d="M12 20a8 8 0 0 1-8-8" />
    </svg>
  );
}
