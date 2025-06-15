const allowedNumbers = process.env.ALLOWED_NUMBERS?.split(',') || [];

export function isAuthorized(phone: string): boolean {
  return allowedNumbers.includes(phone);
}
