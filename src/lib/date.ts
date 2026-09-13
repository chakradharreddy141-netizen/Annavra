/**
 * Returns the local date string for a specific IANA timezone.
 * Used to ensure health day boundaries (e.g., midnight) are authoritative.
 * @param timezone - IANA timezone string (e.g. 'Asia/Kolkata')
 * @param dateObj - Optional Date object to format. Defaults to now.
 * @returns string in 'YYYY-MM-DD' format
 */
export function getUserLocalDate(timezone: string = 'UTC', dateObj: Date = new Date()): string {
  try {
    return dateObj.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch (e) {
    console.error(`Invalid timezone: ${timezone}`);
    return dateObj.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  }
}
