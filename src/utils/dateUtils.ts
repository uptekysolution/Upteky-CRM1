/**
 * Utility functions for handling dates, especially Firestore Timestamps
 * that may be serialized to JSON and lose their .toDate() method
 */

/**
 * Safely converts any date-like object to a Date object
 * Handles Firestore Timestamps, Date objects, strings, and numbers
 */
export function safeToDate(dateObj: any): Date | null {
  if (!dateObj) return null;

  // If it's a Firestore Timestamp with toDate method
  if (dateObj.toDate && typeof dateObj.toDate === 'function') {
    return dateObj.toDate();
  }

  // If it's already a Date object
  if (dateObj instanceof Date) {
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  // If it's a string or number, try to create a Date
  if (typeof dateObj === 'string' || typeof dateObj === 'number') {
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? null : d;
  }

  // If it's an object (but not a Date or Timestamp), it's invalid
  return null;
}

/**
 * Safely formats a date-like object using the provided format string
 * Uses date-fns format function internally
 */
export function safeFormat(dateObj: any, formatStr: string): string {
  try {
    const { format } = require('date-fns');
    const date = safeToDate(dateObj);
    if (!date) return 'Invalid Date';
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', dateObj, error);
    return 'Invalid Date';
  }
}

/**
 * Calculates the number of days between two date-like objects
 */
export function getDaysBetween(startDate: any, endDate: any): number {
  const start = safeToDate(startDate);
  const end = safeToDate(endDate);

  // If either date is invalid, return 0 to avoid runtime errors
  if (!start || !end) return 0;

  const startMs = start.getTime();
  const endMs = end.getTime();
  if (isNaN(startMs) || isNaN(endMs)) return 0;

  const diffTime = Math.abs(endMs - startMs);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Include both start and end dates; ensure at least 1 day when valid
  return Math.max(1, diffDays + 1);
}

/**
 * Checks if a date-like object is a Firestore Timestamp
 */
export function isFirestoreTimestamp(dateObj: any): boolean {
  return dateObj && typeof dateObj.toDate === 'function';
}

/**
 * Converts a date-like object to an ISO string safely
 */
export function safeToISOString(dateObj: any): string {
  return safeToDate(dateObj).toISOString();
}

/**
 * Converts a date-like object to a locale string safely
 */
export function safeToLocaleString(dateObj: any, options?: Intl.DateTimeFormatOptions): string {
  return safeToDate(dateObj).toLocaleString(undefined, options);
}
