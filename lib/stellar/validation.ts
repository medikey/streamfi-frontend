/**
 * Stellar address validation utilities
 * Validates Stellar public key format (must start with 'G' and be 56 characters)
 */

/**
 * Validates if a string is a valid Stellar public address
 * Stellar public addresses:
 * - Start with 'G'
 * - Are exactly 56 characters long
 * - Contain only base32 characters (A-Z, 2-7)
 * @param address The address string to validate
 * @returns true if valid Stellar address, false otherwise
 */
export function isValidStellarAddress(address: unknown): boolean {
  // Check if address exists and is a string
  if (!address || typeof address !== "string") {
    return false;
  }

  // Trim whitespace
  const trimmed = address.trim();

  // Must start with 'G'
  if (!trimmed.startsWith("G")) {
    return false;
  }

  // Must be exactly 56 characters
  if (trimmed.length !== 56) {
    return false;
  }

  // Must contain only valid base32 characters (A-Z, 2-7)
  // Stellar uses RFC4648 base32 alphabet
  const base32Regex = /^G[A-Z2-7]{55}$/;
  return base32Regex.test(trimmed);
}

/**
 * Validates if a string looks like a StarkNet address
 * (for detecting migration errors from StarkNet)
 * StarkNet addresses typically:
 * - Start with '0x'
 * - Are hexadecimal (0-9, a-f)
 * @param address The address string to check
 * @returns true if looks like StarkNet address, false otherwise
 */
export function looksLikeStarkNetAddress(address: unknown): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim();

  // StarkNet addresses start with 0x and are hex
  if (trimmed.startsWith("0x")) {
    // Check if remaining part is valid hex
    return /^0x[0-9a-fA-F]+$/.test(trimmed);
  }

  // Some StarkNet addresses might be without 0x prefix
  if (/^[0-9a-fA-F]{40,}$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Validates and normalizes a Stellar address
 * @param address The address to validate and normalize
 * @returns The normalized address (trimmed) if valid, null otherwise
 */
export function validateAndNormalizeStellarAddress(
  address: unknown
): string | null {
  if (!isValidStellarAddress(address)) {
    return null;
  }

  // Safe to cast since we've validated it's a string
  return (address as string).trim();
}
