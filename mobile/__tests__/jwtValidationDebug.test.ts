/**
 * @fileoverview JWT Validation Debug Tests
 * @description Debug which token is incorrectly passing validation
 */

// Same validateJWTFormat function for debugging
function validateJWTFormat(token: string): boolean {
  try {
    // Check if token exists and is a string
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Remove Bearer prefix if present
    const cleanToken = token.startsWith('Bearer ') 
      ? token.substring(7) 
      : token;

    // Check if token is empty after cleaning
    if (!cleanToken || cleanToken.trim() === '') {
      return false;
    }

    // JWT should have exactly 3 parts separated by dots
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if each part is base64url encoded (basic validation)
    for (const part of parts) {
      if (!part || part.length === 0) {
        return false;
      }
      
      // Base64url should not contain invalid characters
      if (!/^[A-Za-z0-9_-]*$/.test(part)) {
        return false;
      }
    }

    // Try to decode all three parts to validate structure
    try {
      // Validate header
      const header = decodeBase64UrlSafe(parts[0]);
      if (!header) {
        return false;
      }
      
      // Validate payload
      const payload = decodeBase64UrlSafe(parts[1]);
      if (!payload) {
        return false;
      }
      
      // Validate signature part can be decoded (even if we don't verify it)
      // This ensures it's properly formatted base64url
      const signature = decodeBase64UrlSafe(parts[2]);
      if (signature === null) {
        return false;
      }
      
      const headerObj = JSON.parse(header);
      const payloadObj = JSON.parse(payload);
      
      // Basic structure validation
      if (!headerObj.alg || !headerObj.typ) {
        return false;
      }
      
      if (typeof payloadObj !== 'object' || payloadObj === null) {
        return false;
      }
      
      return true;
    } catch (decodeError) {
      return false;
    }
  } catch (error) {
    return false;
  }
}

function decodeBase64UrlSafe(input: string): string | null {
  try {
    // Handle padding for base64url
    const padded = input + '='.repeat((4 - input.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    
    // Try browser/React Native atob first
    if (typeof atob !== 'undefined') {
      return atob(base64);
    }
    
    // Fallback for Node.js environment (tests)
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf-8');
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

describe('JWT Validation Debug Tests', () => {
  it('should debug each invalid token individually', () => {
    const invalidTokens = [
      { token: null, name: 'null' },
      { token: undefined, name: 'undefined' },
      { token: '', name: 'empty string' },
      { token: 'Bearer ', name: 'Bearer with space' },
      { token: 'Bearer', name: 'Bearer only' },
      { token: 'invalid.token.format', name: 'basic invalid format' },
      { token: 'not-a-jwt-token', name: 'not a jwt token' },
      { token: 'Bearer invalid-token-format', name: 'Bearer with invalid format' },
      { token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed', name: 'Bearer with malformed payload' },
      { token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyM30.invalid-signature', name: 'Bearer with invalid signature chars' },
      { token: 'only.two.parts', name: 'only two parts' },
      { token: 'too.many.parts.here.extra', name: 'too many parts' },
      { token: 'Bearer ..', name: 'Bearer with two dots' },
      { token: 'Bearer ...', name: 'Bearer with three dots' },
      { token: 'Bearer a.b.', name: 'Bearer with ending dot' },
      { token: 'Bearer .b.c', name: 'Bearer with starting dot' },
      { token: 'Bearer a..c', name: 'Bearer with double dot' },
    ];

    invalidTokens.forEach(({ token }) => {
      const result = validateJWTFormat(token as string);
      // Debug: Token validation result
      if (result !== false) {
        // Failed: Token validation mismatch
      }
      expect(result).toBe(false);
    });
  });
});