/**
 * Validates that a URL is safe to use in an anchor tag.
 * Prevents javascript: protocol and other dangerous URLs that could enable XSS.
 */
export const isSafeUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return false;
  }

  try {
    // Handle relative URLs and absolute URLs
    const parsed = new URL(trimmedUrl, window.location.origin);
    // Only allow safe protocols
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    // If URL parsing fails, check if it's a valid relative path
    // Relative paths starting with / are safe
    if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
      return true;
    }
    return false;
  }
};

/**
 * Returns a safe URL or undefined if the URL is not safe.
 */
export const getSafeUrl = (url: string | undefined | null): string | undefined => {
  if (isSafeUrl(url)) {
    return url as string;
  }
  return undefined;
};
