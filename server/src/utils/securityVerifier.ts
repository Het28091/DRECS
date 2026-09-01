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
 * random numbers, alphanumeric mashing, repetitive sequences, or dummy spam.
 */
export const verifyIncidentContent = (title: string, description: string): ContentVerificationResult => {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  if (cleanTitle.length < 5) {
    return { isValid: false, reason: 'Title is too short. Please enter a descriptive title (min 5 characters).' };
  }

  if (cleanDesc.length < 15) {
    return { isValid: false, reason: 'Description is too brief. Please describe the emergency situation in detail (min 15 characters).' };
  }

  const combinedText = `${cleanTitle} ${cleanDesc}`;
  const lowerDesc = cleanDesc.toLowerCase();
  const lowerTitle = cleanTitle.toLowerCase();

  // 1. Common keyboard mash substrings
  const MASH_SUBSTRINGS = [
    'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl',
    'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
    'zxcv', 'xcvb', 'cvbn', 'vbnm',
    'asdasd', 'dfgdfg', 'qweqwe', 'zxczxc', 'abcabc',
    'asda', 'dasd', 'sdaf', 'fdsa', 'dsad', 'sads', 'adsa',
    '123456', '654321', '000000', '111111'
  ];

  for (const sub of MASH_SUBSTRINGS) {
    if (lowerTitle.includes(sub) || lowerDesc.includes(sub)) {
      return {
        isValid: false,
        reason: `Automated verification failed: Text contains invalid keyboard mashing pattern ("${sub}").`,
      };
    }
  }

  // 2. Digit-to-Letter Ratio Check (reject reports that are mostly numbers like "12312 41jk23 41")
  const digitMatches = combinedText.match(/[0-9]/g) || [];
  const letterMatches = combinedText.match(/[a-zA-Z]/g) || [];

  if (letterMatches.length === 0) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description must contain alphabetic text describing the incident.',
    };
  }

  if (digitMatches.length / (digitMatches.length + letterMatches.length) > 0.35) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description contains excessive random numbers or digit mashing.',
    };
  }

  // 3. Token & Word Structure Analysis
  const tokens = cleanDesc.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description must contain at least 3 distinct words.',
    };
  }

  let invalidNoiseTokenCount = 0;
  let validWordCount = 0;

  for (const token of tokens) {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanToken) continue;

    // Mixed alphanumeric noise check (e.g. "1j", "jk1", "41jk23", "3a")
    const hasLetters = /[a-z]/.test(cleanToken);
    const hasNumbers = /[0-9]/.test(cleanToken);

    if (hasLetters && hasNumbers) {
      invalidNoiseTokenCount++;
      continue;
    }

    // Pure number token check (e.g. "12312", "413")
    if (!hasLetters && hasNumbers && cleanToken.length >= 2) {
      invalidNoiseTokenCount++;
      continue;
    }

    // Check for readable word structure (must have vowels or be a valid short word)
    const hasVowel = /[aeiouy]/.test(cleanToken);
    if (cleanToken.length >= 3 && !hasVowel) {
      invalidNoiseTokenCount++;
      continue;
    }

    // Home-row mash letter check (e.g. "asdasd", "asda")
    if (cleanToken.length >= 3 && /^[asdfghjkl]+$/.test(cleanToken) && !hasVowel) {
      invalidNoiseTokenCount++;
      continue;
    }

    if (hasLetters && cleanToken.length >= 2) {
      validWordCount++;
    }
  }

  // Rejection rules for noise tokens
  if (invalidNoiseTokenCount > 0 && invalidNoiseTokenCount / tokens.length >= 0.3) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description contains invalid random numbers or mixed character noise (e.g. "12312 1j jk1 41jk23"). Please enter a clear emergency description.',
    };
  }

  if (validWordCount < 2) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Description lacks meaningful words describing the emergency.',
    };
  }

  // 4. Repeated character sequence check (e.g. "aaaaa", "!!!!!")
  if (/(.)\1{4,}/i.test(cleanTitle) || /(.)\1{4,}/i.test(cleanDesc)) {
    return {
      isValid: false,
      reason: 'Automated verification failed: Text contains repetitive character patterns.',
    };
  }

  return { isValid: true };
};
