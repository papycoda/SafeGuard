/**
 * Security Configuration for SafeGuard Application
 * Centralized security settings and policies
 */

export const SecurityConfig = {
  // Session Management
  session: {
    timeoutMs: 5 * 60 * 1000, // 5 minutes
    checkIntervalMs: 30 * 1000, // 30 seconds
    maxRetryAttempts: 3,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  },

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    windowMs: 60 * 1000, // 1 minute
    maxRequests: {
      videoUpload: 10,
      smsAlert: 5,
      locationUpdate: 20,
      settingsChange: 10,
    },
  },

  // Data Encryption
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 12,
    tagSize: 16,
  },

  // Password Policy (if password auth is used)
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventPersonalInfo: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    maxVideoDuration: 60 * 60, // 1 hour in seconds
    scanForMalware: false, // Set to true if malware scanning is implemented
  },

  // Input Validation
  validation: {
    maxStringLength: 1000,
    maxNameLength: 50,
    maxPhoneLength: 20,
    maxEmailLength: 254,
    sanitizeHTML: true,
    preventSQLInjection: true,
    preventXSS: true,
  },

  // Logging Security
  logging: {
    enableInDevelopment: true,
    enableInProduction: false, // Only log critical errors in production
    maxLogSize: 100,
    sanitizeSensitiveData: true,
    remoteLogging: false, // Enable with proper authentication
    logRetentionDays: 30,
  },

  // API Security
  api: {
    timeoutMs: 30 * 1000, // 30 seconds
    retryAttempts: 3,
    retryDelayMs: 1000,
    enableCertificatePinning: true, // Should be implemented in production
    allowedHostnames: [
      'backend.onspace.ai',
      'supabase.co',
    ],
  },

  // Biometric Authentication
  biometric: {
    enabled: true,
    requireForSensitiveActions: true,
    fallbackToPasscode: true,
    maxAttempts: 3,
  },

  // Data Retention
  dataRetention: {
    emergencyRecordings: 90 * 24 * 60 * 60 * 1000, // 90 days
    logs: 30 * 24 * 60 * 60 * 1000, // 30 days
    analytics: 365 * 24 * 60 * 60 * 1000, // 1 year
  },

  // Content Security Policy
  csp: {
    defaultSrc: "'self'",
    scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval'",
    styleSrc: "'self' 'unsafe-inline'",
    imgSrc: "'self' data: https:",
    connectSrc: "'self' https://backend.onspace.ai https://*.supabase.co",
    fontSrc: "'self' data:",
    objectSrc: "'none'",
    mediaSrc: "'self' blob:",
    frameSrc: "'none'",
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=(self)',
  },

  // Feature Flags
  features: {
    enableScreenShotDetection: false, // Detect screen recording/capture
    enableJailbreakDetection: false, // Detect rooted/jailbroken devices
    enableIntegrityChecks: false, // Verify app integrity
    enableAntiDebugging: false, // Detect debugging attempts
    enableAntiTampering: false, // Detect app modification
  },

  // Compliance Settings
  compliance: {
    gdpr: {
      enabled: true,
      requireConsent: true,
      allowDataExport: true,
      allowDataDeletion: true,
      cookieConsentRequired: false, // Not applicable for mobile app
    },
    hipaa: {
      enabled: false, // Set to true if handling PHI
      encryptionRequired: true,
      auditLogging: true,
      accessControls: true,
    },
  },

  // Emergency Features
  emergency: {
    maxConcurrentAlerts: 5,
    alertCooldownMs: 60 * 1000, // 1 minute between alerts
    autoRetryFailedAlerts: true,
    maxRetries: 3,
  },
};

/**
 * Security environment validation
 */
export function validateSecurityEnvironment(): {
  isSecure: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if running in development mode
  if (__DEV__) {
    warnings.push('Running in development mode - additional security checks disabled');
  }

  // Check if HTTPS is enforced (web only)
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
    errors.push('HTTPS is not enforced - communications are not secure');
  }

  // Check if secure storage is available
  try {
    // This would be checked at runtime
    // warnings.push('Secure storage availability not verified');
  } catch (error) {
    errors.push('Secure storage not available');
  }

  return {
    isSecure: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Security checklist for deployment
 */
export const SECURITY_CHECKLIST = {
  preDeployment: [
    'Rotate all API keys and secrets',
    'Enable RLS policies on all Supabase tables',
    'Review and test all rate limiting configurations',
    'Verify secure storage is working correctly',
    'Test biometric authentication on target devices',
    'Review and validate all input sanitization',
    'Enable production logging with sensitive data redaction',
    'Implement proper error handling and recovery',
    'Test emergency alert system functionality',
    'Verify data encryption at rest and in transit',
  ],

  postDeployment: [
    'Monitor application logs for security issues',
    'Set up alerts for suspicious activities',
    'Review audit logs regularly',
    'Test backup and restore procedures',
    'Verify security headers are correctly implemented',
    'Monitor performance impact of security measures',
    'Conduct penetration testing',
    'Review user access controls',
  ],

  ongoing: [
    'Regularly update dependencies for security patches',
    'Monitor and respond to security advisories',
    'Conduct regular security audits',
    'Review and update security policies',
    'Maintain security documentation',
    'Train developers on security best practices',
    'Stay informed about emerging threats',
    'Participate in bug bounty programs',
  ],
};

/**
 * Security event types for logging and monitoring
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  BIOMETRIC_AUTH_SUCCESS = 'biometric_auth_success',
  BIOMETRIC_AUTH_FAILURE = 'biometric_auth_failure',
  SESSION_TIMEOUT = 'session_timeout',

  // Data access events
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',

  // Security events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  INJECTION_ATTEMPT = 'injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',

  // Emergency events
  EMERGENCY_ALERT_SENT = 'emergency_alert_sent',
  EMERGENCY_ALERT_FAILED = 'emergency_alert_failed',
  RECORDING_UPLOAD = 'recording_upload',
  RECORDING_ACCESS = 'recording_access',
}

/**
 * Log security events
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  details?: Record<string, any>
): void {
  // In production, this would send to a security monitoring service
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    details: details ? JSON.stringify(details) : undefined,
  };

  // For now, just use the secure logger
  import('./secureLogger').then(({ default: logger }) => {
    logger.info('Security event', event);
  });
}
