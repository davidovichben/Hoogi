import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReferralTrackingService {
  /**
   * Detects the channel/source from which the user arrived at the questionnaire
   * Checks URL parameters (src, utm_source) and document.referrer
   * Returns a channel name like 'facebook', 'instagram', 'linkedin', 'google', 'direct', etc.
   */
  detectChannel(): string {
    const urlParams = new URLSearchParams(window.location.search);

    // First, check for 'src' parameter (e.g., ?src=facebook)
    const srcParam = urlParams.get('src');
    if (srcParam) {
      return this.normalizeSource(srcParam);
    }

    // Then check for utm_source parameter
    const utmSource = urlParams.get('utm_source');
    if (utmSource) {
      return this.normalizeSource(utmSource);
    }

    // If no UTM parameter, check the HTTP referer
    const referer = document.referrer;

    if (!referer) {
      // No referer means direct traffic
      return 'direct';
    }

    try {
      const refererUrl = new URL(referer);
      const refererHost = refererUrl.hostname.toLowerCase();

      // Check for known social media and traffic sources
      if (this.isFromSource(refererHost, ['facebook.com', 'fb.com', 'm.facebook.com'])) {
        return 'facebook';
      }

      if (this.isFromSource(refererHost, ['instagram.com', 'm.instagram.com'])) {
        return 'instagram';
      }

      if (this.isFromSource(refererHost, ['linkedin.com', 'lnkd.in'])) {
        return 'linkedin';
      }

      if (this.isFromSource(refererHost, ['twitter.com', 't.co', 'x.com'])) {
        return 'twitter';
      }

      if (this.isFromSource(refererHost, ['youtube.com', 'youtu.be', 'm.youtube.com'])) {
        return 'youtube';
      }

      if (this.isFromSource(refererHost, ['tiktok.com'])) {
        return 'tiktok';
      }

      if (this.isFromSource(refererHost, ['pinterest.com', 'pin.it'])) {
        return 'pinterest';
      }

      if (this.isFromSource(refererHost, ['reddit.com'])) {
        return 'reddit';
      }

      if (this.isFromSource(refererHost, ['google.com', 'google.co.il'])) {
        return 'google';
      }

      if (this.isFromSource(refererHost, ['bing.com'])) {
        return 'bing';
      }

      if (this.isFromSource(refererHost, ['yahoo.com'])) {
        return 'yahoo';
      }

      if (this.isFromSource(refererHost, ['whatsapp.com', 'wa.me', 'chat.whatsapp.com'])) {
        return 'whatsapp';
      }

      if (this.isFromSource(refererHost, ['telegram.org', 't.me'])) {
        return 'telegram';
      }

      // If it's from another website, return 'referral' with the domain
      return `referral-${refererHost}`;

    } catch (error) {
      console.error('Error parsing referer URL:', error);
      return 'unknown';
    }
  }

  /**
   * Check if a hostname matches any of the given sources
   */
  private isFromSource(hostname: string, sources: string[]): boolean {
    return sources.some(source =>
      hostname === source || hostname.endsWith('.' + source)
    );
  }

  /**
   * Normalize a source string (from utm_source) to a standard channel name
   */
  private normalizeSource(source: string): string {
    const normalized = source.toLowerCase().trim();

    // Map common variations to standard names
    const sourceMap: Record<string, string> = {
      'fb': 'facebook',
      'ig': 'instagram',
      'li': 'linkedin',
      'in': 'linkedin',
      'tw': 'twitter',
      'yt': 'youtube',
      'wa': 'whatsapp',
      'tg': 'telegram',
      'goog': 'google'
    };

    return sourceMap[normalized] || normalized;
  }

  /**
   * Get additional tracking data (UTM parameters)
   * Returns an object with utm_medium, utm_campaign, etc.
   */
  getTrackingParams(): {
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  } {
    const urlParams = new URLSearchParams(window.location.search);

    return {
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
    };
  }
}
