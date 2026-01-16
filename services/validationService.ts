/**
 * Enhanced input validation and sanitization service
 * Provides strict validation to prevent injection attacks and ensure data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export class ValidationService {
  // Common patterns for validation
  private static readonly PATTERNS = {
    // Strict international phone number validation
    // Requires country code, allows common separators, min 6 digits total
    PHONE: /^\+?[1-9]\d{0,2}[\s\-()]?[\d\s\-\(\)]{6,14}$/,

    // Email validation (more strict than basic regex)
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

    // Name validation (letters, spaces, hyphens, apostrophes)
    NAME: /^[a-zA-Z\u00C0-\u00FF\s'\-]{2,50}$/,

    // Alphanumeric with spaces for general text
    TEXT: /^[a-zA-Z0-9\s\.\,\!\?\-]{1,500}$/,

    // URL validation
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  };

  // Maximum lengths for various fields
  private static readonly MAX_LENGTHS = {
    NAME: 50,
    PHONE: 20,
    EMAIL: 254,
    ADDRESS: 500,
    RELATIONSHIP: 50,
    GENERAL_TEXT: 1000,
  };

  /**
   * Validate and sanitize phone number
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const trimmed = phone.trim();

    // Check length
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }

    if (trimmed.length > this.MAX_LENGTHS.PHONE) {
      return { isValid: false, error: 'Phone number is too long' };
    }

    // Remove common separators for validation
    const normalized = trimmed.replace(/[\s\-\(\)]/g, '');

    // Validate format
    if (!this.PATTERNS.PHONE.test(trimmed) && !/^\+?\d{6,15}$/.test(normalized)) {
      return {
        isValid: false,
        error: 'Invalid phone number format. Use international format: +1 5551234567'
      };
    }

    // Sanitize by keeping only safe characters
    const sanitized = trimmed.replace(/[^\d\+\-\(\)\s]/g, '');

    return { isValid: true, sanitizedValue: sanitized };
  }

  /**
   * Validate and sanitize email address
   */
  static validateEmail(email: string): ValidationResult {
    const trimmed = email.trim().toLowerCase();

    if (trimmed.length === 0) {
      return { isValid: false, error: 'Email is required' };
    }

    if (trimmed.length > this.MAX_LENGTHS.EMAIL) {
      return { isValid: false, error: 'Email is too long' };
    }

    if (!this.PATTERNS.EMAIL.test(trimmed)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true, sanitizedValue: trimmed };
  }

  /**
   * Validate and sanitize person name
   */
  static validateName(name: string): ValidationResult {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return { isValid: false, error: 'Name is required' };
    }

    if (trimmed.length > this.MAX_LENGTHS.NAME) {
      return { isValid: false, error: 'Name is too long (max 50 characters)' };
    }

    if (!this.PATTERNS.NAME.test(trimmed)) {
      return {
        isValid: false,
        error: 'Name contains invalid characters. Use only letters, spaces, hyphens, and apostrophes'
      };
    }

    // Remove any potential XSS attempts
    const sanitized = trimmed.replace(/<[^>]*>/g, '');

    return { isValid: true, sanitizedValue: sanitized };
  }

  /**
   * Validate and sanitize general text fields
   */
  static validateText(text: string, maxLength: number = this.MAX_LENGTHS.GENERAL_TEXT): ValidationResult {
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      return { isValid: false, error: 'This field is required' };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, error: `Text is too long (max ${maxLength} characters)` };
    }

    // Remove HTML tags and potential XSS
    const sanitized = trimmed
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    if (sanitized.length === 0) {
      return { isValid: false, error: 'Text contains only invalid characters' };
    }

    return { isValid: true, sanitizedValue: sanitized };
  }

  /**
   * Validate relationship field
   */
  static validateRelationship(relationship: string): ValidationResult {
    if (!relationship || relationship.trim().length === 0) {
      return { isValid: true, sanitizedValue: '' }; // Optional field
    }

    const result = this.validateText(relationship, this.MAX_LENGTHS.RELATIONSHIP);
    if (!result.isValid) {
      return { isValid: false, error: 'Invalid relationship format' };
    }

    return { isValid: true, sanitizedValue: result.sanitizedValue };
  }

  /**
   * Sanitize any string to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate emergency contact data
   */
  static validateEmergencyContact(contact: {
    name: string;
    phone: string;
    relationship?: string;
  }): ValidationResult {
    // Validate name
    const nameResult = this.validateName(contact.name);
    if (!nameResult.isValid) {
      return { isValid: false, error: `Name: ${nameResult.error}` };
    }

    // Validate phone
    const phoneResult = this.validatePhoneNumber(contact.phone);
    if (!phoneResult.isValid) {
      return { isValid: false, error: `Phone: ${phoneResult.error}` };
    }

    // Validate relationship if provided
    if (contact.relationship) {
      const relationshipResult = this.validateRelationship(contact.relationship);
      if (!relationshipResult.isValid) {
        return { isValid: false, error: `Relationship: ${relationshipResult.error}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate location data
   */
  static validateLocation(location: {
    latitude: number;
    longitude: number;
    address?: string;
  }): ValidationResult {
    // Validate latitude
    if (isNaN(location.latitude) || location.latitude < -90 || location.latitude > 90) {
      return { isValid: false, error: 'Invalid latitude value' };
    }

    // Validate longitude
    if (isNaN(location.longitude) || location.longitude < -180 || location.longitude > 180) {
      return { isValid: false, error: 'Invalid longitude value' };
    }

    // Validate address if provided
    if (location.address) {
      const addressResult = this.validateText(location.address, this.MAX_LENGTHS.ADDRESS);
      if (!addressResult.isValid) {
        return { isValid: false, error: `Address: ${addressResult.error}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Check for SQL injection patterns
   */
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"].*['"]\s*=\s*['"].*['"])/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bEXEC\b|\bEXECUTE\b)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeInput(input[key]);
        }
      }
      return sanitized;
    }

    return input;
  }
}

/**
 * Rate limiting utility to prevent abuse
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 10;

  /**
   * Check if a request should be allowed based on rate limiting
   */
  static async checkLimit(identifier: string): Promise<{ allowed: boolean; remainingRequests: number }> {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Remove old requests outside the time window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.MAX_REQUESTS) {
      return {
        allowed: false,
        remainingRequests: 0
      };
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return {
      allowed: true,
      remainingRequests: this.MAX_REQUESTS - requests.length
    };
  }

  /**
   * Clear rate limit data (for testing or manual reset)
   */
  static clearLimit(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}
