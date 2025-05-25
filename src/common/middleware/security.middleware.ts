import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly requestCounts = new Map<string, number>();
  private readonly REQUEST_LIMIT = 100;
  private readonly RESET_INTERVAL = 60000;

  constructor(private readonly configService: ConfigService) {
    setInterval(() => {
      this.requestCounts.clear();
    }, this.RESET_INTERVAL);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const apiKey = req.headers['x-api-key'] as string;

    // API Key validation
    if (!apiKey) {
      this.logger.warn(`Missing API key from IP: ${clientIP}`);
      throw new UnauthorizedException('API key is required');
    }

    if (!this.configService.validateApiKey(apiKey)) {
      this.logger.warn(`Invalid API key from IP: ${clientIP}`);
      throw new UnauthorizedException('Invalid API key');
    }

    // Rate limiting
    if (this.isRateLimited(clientIP)) {
      this.logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
      });
    }

    // Log security-relevant information
    this.logger.debug(
      `Request from ${clientIP} - ${req.method} ${req.path} - UA: ${userAgent}`,
    );

    // Add security headers
    this.addSecurityHeaders(res);

    // Validate request size (prevent large payloads)
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 1024 * 1024) {
      // 1MB limit
      this.logger.warn(
        `Large payload detected from IP: ${clientIP} - Size: ${contentLength}`,
      );
      return res.status(413).json({
        statusCode: 413,
        message: 'Payload too large',
        error: 'Payload Too Large',
      });
    }

    this.incrementRequestCount(clientIP);

    next();
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private isRateLimited(clientIP: string): boolean {
    const currentCount = this.requestCounts.get(clientIP) || 0;
    return currentCount >= this.REQUEST_LIMIT;
  }

  private incrementRequestCount(clientIP: string): void {
    const currentCount = this.requestCounts.get(clientIP) || 0;
    this.requestCounts.set(clientIP, currentCount + 1);
  }

  private addSecurityHeaders(res: Response): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict transport security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    // Content security policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // Remove server information
    res.removeHeader('X-Powered-By');
  }
}
