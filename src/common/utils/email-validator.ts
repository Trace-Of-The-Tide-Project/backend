import { resolveMx } from 'dns/promises';

/**
 * Common disposable/temporary email domains.
 * Extend this list as needed.
 */
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'mailinator.com',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'tempail.com',
  'temp-mail.org',
  'temp-mail.io',
  'fakeinbox.com',
  'mailnesia.com',
  'maildrop.cc',
  'discard.email',
  'mailcatch.com',
  'mintemail.com',
  'mohmal.com',
  'getnada.com',
  'emailondeck.com',
  'crazymailing.com',
  'tmail.ws',
  '10minutemail.com',
  'tempr.email',
  'harakirimail.com',
  'burnermail.io',
  'tempinbox.com',
  'mailtemp.net',
]);

export interface EmailValidationResult {
  valid: boolean;
  reason?:
    | 'invalid_format'
    | 'no_mx_records'
    | 'disposable_domain'
    | 'dns_error';
  message: string;
}

/**
 * Validate an email address by checking:
 * 1. Basic format (has @ and domain)
 * 2. Domain is not a known disposable email provider
 * 3. Domain has valid MX records (can actually receive mail)
 */
export async function validateEmailDomain(
  email: string,
): Promise<EmailValidationResult> {
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1]) {
    return {
      valid: false,
      reason: 'invalid_format',
      message: 'Invalid email format',
    };
  }

  const domain = parts[1].toLowerCase();

  // Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: 'disposable_domain',
      message: 'Disposable email addresses are not allowed',
    };
  }

  // Check MX records
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: 'no_mx_records',
        message: 'This email domain cannot receive emails',
      };
    }
    return { valid: true, message: 'Email domain is valid' };
  } catch {
    return {
      valid: false,
      reason: 'no_mx_records',
      message: 'This email domain does not exist or cannot receive emails',
    };
  }
}
