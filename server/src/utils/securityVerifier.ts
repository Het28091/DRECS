/**
 * Security and Content Moderation Engine for DRECS
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ContentVerificationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates password strength according to enterprise security standards.
 */
export const validatePasswordSecurity = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeric digit (0-9)');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Automated Verification Engine for Incident Reports
 * Analyzes submitted title and description text to reject gibberish,
 * random keyboard mashing, repeated character sequences, or dummy spam.
 */
export const verifyIncidentContent = (title: string, description: string): ContentVerificationResult => {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5) {
    return { isValid: false, reason: 'Title is too short. Please enter a descriptive title (min 5 characters).' };
  }

  if (cleanDesc.length < 15) {
    return { isValid: false, reason: 'Description is too brief. Please describe the emergency in detail (min 15 characters).' };
  }

  // 1. Common keyboard mash substrings and sequences
  const MASH_SUBSTRINGS = [
    'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl',
    'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
    'zxcv', 'xcvb', 'cvbn', 'vbnm',
    'asdasd', 'dfgdfg', 'qweqwe', 'zxczxc', 'abcabc',
    'asda', 'dasd', 'sdaf', 'fdsa', 'dsad', 'sads', 'adsa',
    '123456', '654321', '000000', '111111'
  ];

  const lowerDesc = cleanDesc.toLowerCase();
  const lowerTitle = cleanTitle.toLowerCase();

  for (const sub of MASH_SUBSTRINGS) {
    if (lowerTitle.includes(sub) || lowerDesc.includes(sub)) {
      return {
        isValid: false,
        reason: 'Automated verification failed: Text contains invalid keyboard mashing or random repetitive characters (e.g. "' + sub + '").',
      };
    }
  }

  // 2. Word-by-word structural analysis
  const words = cleanDesc.split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description must contain at least 3 distinct words.',
    };
  }

  // Count gibberish words consisting only of home-row mash letters (a, s, d, f, g, h, j, k, l)
  let gibberishWordCount = 0;
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length >= 3 && /^[asdfghjkl]+$/.test(cleanWord)) {
      gibberishWordCount++;
    }
  }

  if (gibberishWordCount >= 2 || (words.length > 0 && gibberishWordCount / words.length > 0.4)) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description contains random keyboard mash words (e.g. "asdasd asda"). Please write a meaningful emergency description.',
    };
  }

  // 3. Repeated character sequences check (e.g. "aaaaa", "!!!!!")
  if (/(.)\1{4,}/i.test(cleanTitle) || /(.)\1{4,}/i.test(cleanDesc)) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Text contains repetitive character patterns.',
    };
  }

  return { isValid: true };
};
