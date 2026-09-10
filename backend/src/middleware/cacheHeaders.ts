// backend/src/middleware/cacheHeaders.ts
//
// Sets appropriate HTTP response headers for API responses.
//
// Security requirements:
// - Medical/patient data must never be cached by browsers, proxies, or CDNs.
// - API responses are explicitly marked as private and non-cacheable.
// - Health checks may be cached briefly to reduce infrastructure polling load.
// - Security headers are applied consistently to API responses.

import type { Request, Response, NextFunction } from 'express';

export function setCacheHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  /*
   * Health check
   *
   * Health endpoints normally contain no patient/medical data and may be
   * cached briefly to reduce unnecessary load from load balancers and
   * monitoring systems.
   *
   * Use the pathname rather than the complete URL so query strings do not
   * affect the check.
   */
  if (req.path === '/health') {
    res.set({
      'Cache-Control': 'public, max-age=60',
    });

    next();
    return;
  }

  /*
   * All API endpoints
   *
   * Medical and authentication-related responses must never be stored.
   *
   * `no-store` is the critical directive. It instructs compliant browsers,
   * proxies, and other caches not to store the response.
   *
   * `private` additionally prevents shared caches from serving the response
   * to other users.
   */
  if (req.path.startsWith('/api')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',

      // Prevent MIME-type sniffing.
      'X-Content-Type-Options': 'nosniff',

      // Prevent framing/clickjacking.
      'X-Frame-Options': 'DENY',

      // Prevent browsers from sending the full URL as the referrer.
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      /*
       * API responses should not load external resources.
       *
       * This is intentionally restrictive. It is suitable for JSON/API
       * responses and does not attempt to serve application HTML.
       */
      'Content-Security-Policy': "default-src 'none'",
    });
  }

  next();
}