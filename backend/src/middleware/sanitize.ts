// backend/src/middleware/sanitize.ts
// Sanitizes incoming request data to prevent XSS attacks.
// Defense-in-depth: React already escapes JSX, but this protects
// PDF generation, emails, and any future non-React output.

/**
 * Removes potentially dangerous content from a string:
 * - <script> tags and their content
 * - All HTML tags
 * - javascript: protocol URLs
 * - on* event handler attributes
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    // Remove entire <script>...</script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <style>...</style> blocks
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove <iframe>...</iframe> blocks
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data:text/html protocol
    .replace(/data:text\/html/gi, '')
    // Remove on* event handlers (onclick, onload, etc.)
    .replace(/\bon\w+\s*=/gi, '')
    // Remove HTML entities that could be used for obfuscation
    .replace(/&#x?[0-9a-f]+;?/gi, '')
    // Trim excessive whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Recursively sanitizes an object's string values.
 * Skips null, undefined, numbers, booleans, arrays of non-strings.
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj; // Prevent deep recursion attacks

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip password fields (they get hashed, not stored raw)
      if (key.toLowerCase().includes('password')) {
        sanitized[key] = value;
        continue;
      }
      // Skip base64 data (logo images)
      if (key === 'centerLogo' || key === 'logo') {
        sanitized[key] = value;
        continue;
      }
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Express middleware: sanitizes req.body for all requests with a body.
 */
export function sanitizeInput(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body) as Record<string, unknown>;
  }

  // Sanitize query parameters (for search terms, etc.)
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        (req.query as Record<string, unknown>)[key] = sanitizeString(value);
      }
    }
  }

  next();
}