/**
 * Fixes common encoding issues where Windows-1252 or ISO-8859-1 characters
 * were incorrectly interpreted as UTF-8, resulting in garbled text.
 * 
 * Common issues:
 * - â€™ → ' (apostrophe)
 * - â€" → — (em dash)
 * - â€" → – (en dash)
 * - â€œ → " (left double quote)
 * - â€ → " (right double quote)
 * - â€˜ → ' (left single quote)
 * - â€¢ → • (bullet)
 * - â€" → … (ellipsis)
 */

export function fixEncoding(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Fix apostrophes and quotes
    .replace(/â€™/g, "'")  // Right single quotation mark
    .replace(/â€˜/g, "'")  // Left single quotation mark
    .replace(/â€™/g, "'")  // Another variant
    .replace(/â€œ/g, '"')  // Left double quotation mark
    .replace(/â€/g, '"')   // Right double quotation mark
    .replace(/â€"/g, '"')  // Another variant
    // Fix dashes
    .replace(/â€"/g, '—')  // Em dash
    .replace(/â€"/g, '–')  // En dash
    .replace(/â€"/g, '-')   // Regular dash fallback
    // Fix other common characters
    .replace(/â€¢/g, '•')   // Bullet
    .replace(/â€"/g, '…')  // Ellipsis
    .replace(/â€"/g, '…')  // Another ellipsis variant
    // Fix common accented characters that might be mis-encoded
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¡/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ');
}

/**
 * Fixes encoding issues in an object recursively
 */
export function fixEncodingInObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return fixEncoding(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => fixEncodingInObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const fixed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      fixed[key] = fixEncodingInObject(value);
    }
    return fixed as T;
  }

  return obj;
}

