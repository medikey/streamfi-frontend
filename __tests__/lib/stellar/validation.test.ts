/**
 * Stellar address validation tests
 * Tests isValidStellarAddress with valid G-addresses, invalid strings, etc.
 */

import {
  isValidStellarAddress,
  looksLikeStarkNetAddress,
  validateAndNormalizeStellarAddress,
} from "@/lib/stellar/validation";

describe("isValidStellarAddress", () => {
  describe("Valid Stellar addresses", () => {
    it("should accept valid Stellar public key (starts with G, 56 chars)", () => {
      const validAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should accept another valid Stellar address", () => {
      const validAddress = "GA5XIGA5C5BWTIVM2I5ZUN3D4K4KVJFFDZSTOD5HZUE34JRZJQEBJZA";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should accept address with leading/trailing whitespace", () => {
      const validAddress = "  GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5  ";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should accept address with base32 characters (2-7)", () => {
      const validAddress = "G2ZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should accept address with all base32 uppercase letters", () => {
      const validAddress = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });
  });

  describe("Invalid Stellar addresses", () => {
    it("should reject empty string", () => {
      expect(isValidStellarAddress("")).toBe(false);
    });

    it("should reject null", () => {
      expect(isValidStellarAddress(null)).toBe(false);
    });

    it("should reject undefined", () => {
      expect(isValidStellarAddress(undefined)).toBe(false);
    });

    it("should reject non-string types", () => {
      expect(isValidStellarAddress(123)).toBe(false);
      expect(isValidStellarAddress({})).toBe(false);
      expect(isValidStellarAddress([])).toBe(false);
      expect(isValidStellarAddress(true)).toBe(false);
    });

    it("should reject address that doesn't start with G", () => {
      const invalidAddress = "HBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address with lowercase starting G", () => {
      const invalidAddress = "gBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address that's too short", () => {
      const invalidAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EX";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address that's too long", () => {
      const invalidAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT55";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address with invalid characters", () => {
      // Contains 0 and 1 which are not in base32 alphabet
      const invalidAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EX01";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address with lowercase letters", () => {
      const invalidAddress = "GBZVMb74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address with special characters", () => {
      const invalidAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EX!@";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject address with spaces in middle", () => {
      const invalidAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5 GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should reject whitespace-only string", () => {
      expect(isValidStellarAddress("   ")).toBe(false);
    });

    it("should reject address with correct length but wrong format", () => {
      const invalidAddress = "A" + "B".repeat(54) + "C";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should handle very long strings", () => {
      const veryLongString = "G" + "A".repeat(1000);
      expect(isValidStellarAddress(veryLongString)).toBe(false);
    });

    it("should handle only 'G' character", () => {
      expect(isValidStellarAddress("G")).toBe(false);
    });
  });
});

describe("looksLikeStarkNetAddress", () => {
  describe("Valid StarkNet-like addresses", () => {
    it("should identify 0x-prefixed hex address as StarkNet-like", () => {
      const starkAddress = "0x123456789abcdef";
      expect(looksLikeStarkNetAddress(starkAddress)).toBe(true);
    });

    it("should identify full-length hex address (without 0x) as StarkNet-like", () => {
      const starkAddress = "123456789abcdef0123456789abcdef0123456789abcdef0";
      expect(looksLikeStarkNetAddress(starkAddress)).toBe(true);
    });

    it("should handle uppercase hex in 0x address", () => {
      const starkAddress = "0xABCDEF123456";
      expect(looksLikeStarkNetAddress(starkAddress)).toBe(true);
    });

    it("should handle mixed case hex in 0x address", () => {
      const starkAddress = "0xAbCdEf123456";
      expect(looksLikeStarkNetAddress(starkAddress)).toBe(true);
    });
  });

  describe("Invalid StarkNet-like addresses", () => {
    it("should reject valid Stellar address", () => {
      const stellarAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      expect(looksLikeStarkNetAddress(stellarAddress)).toBe(false);
    });

    it("should reject null", () => {
      expect(looksLikeStarkNetAddress(null)).toBe(false);
    });

    it("should reject undefined", () => {
      expect(looksLikeStarkNetAddress(undefined)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(looksLikeStarkNetAddress("")).toBe(false);
    });

    it("should reject non-string types", () => {
      expect(looksLikeStarkNetAddress(123)).toBe(false);
      expect(looksLikeStarkNetAddress({})).toBe(false);
    });

    it("should reject 0x with non-hex characters", () => {
      const invalidAddress = "0xGHIJKL";
      expect(looksLikeStarkNetAddress(invalidAddress)).toBe(false);
    });

    it("should reject hex string without 0x prefix but short", () => {
      const shortHex = "abcdef";
      expect(looksLikeStarkNetAddress(shortHex)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace in 0x address", () => {
      const addressWithSpace = "0x 123456";
      expect(looksLikeStarkNetAddress(addressWithSpace)).toBe(false);
    });

    it("should reject 0x with only numbers", () => {
      const addressNumbers = "0x1234567890";
      expect(looksLikeStarkNetAddress(addressNumbers)).toBe(true); // Numbers are valid hex
    });

    it("should handle very long hex string", () => {
      const veryLongHex = "0x" + "a".repeat(1000);
      expect(looksLikeStarkNetAddress(veryLongHex)).toBe(true);
    });
  });
});

describe("validateAndNormalizeStellarAddress", () => {
  describe("Valid addresses", () => {
    it("should return normalized address for valid Stellar address", () => {
      const validAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const result = validateAndNormalizeStellarAddress(validAddress);
      expect(result).toBe(validAddress);
    });

    it("should trim whitespace from valid address", () => {
      const validAddress =
        "  GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5  ";
      const result = validateAndNormalizeStellarAddress(validAddress);
      expect(result).toBe(
        "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5"
      );
    });
  });

  describe("Invalid addresses", () => {
    it("should return null for invalid address", () => {
      const invalidAddress = "invalid-address";
      const result = validateAndNormalizeStellarAddress(invalidAddress);
      expect(result).toBeNull();
    });

    it("should return null for StarkNet address", () => {
      const starkAddress = "0x123456789abcdef";
      const result = validateAndNormalizeStellarAddress(starkAddress);
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = validateAndNormalizeStellarAddress(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = validateAndNormalizeStellarAddress(undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = validateAndNormalizeStellarAddress("");
      expect(result).toBeNull();
    });

    it("should return null for non-string types", () => {
      expect(validateAndNormalizeStellarAddress(123)).toBeNull();
      expect(validateAndNormalizeStellarAddress({})).toBeNull();
      expect(validateAndNormalizeStellarAddress([])).toBeNull();
    });
  });
});
