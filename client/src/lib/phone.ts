// Format/plausibility only; proving ownership requires OTP verification.
export function isValidMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value) && !/^(\d)\1{9}$/.test(value)
    && !/^(\d{2})\1{4}$/.test(value) && !/^(\d{5})\1$/.test(value)
    && !['01234567890123456789', '98765432109876543210'].some(sequence => sequence.includes(value));
}

export function normalizeContact(value: string): string {
  const input = value.trim();
  if (input.includes('@')) return input.toLowerCase();
  if (!/^[+\d\s()-]+$/.test(input)) return input;
  let phone = input.replace(/[\s()-]/g, '');
  if (phone.startsWith('+91')) phone = phone.slice(3);
  return phone;
}
export const isValidContact = (value: string) => {
  const contact = normalizeContact(value);
  return contact.length <= 200 && (isValidMobile(contact) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact));
};
