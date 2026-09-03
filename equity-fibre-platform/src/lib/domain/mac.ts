/**
 * MAC address normalisation and validation for modem WAN interfaces.
 *
 * - Accepts colon, hyphen, dot (Cisco) and bare formats.
 * - Canonical form: lowercase, colon-separated (aa:bb:cc:dd:ee:ff).
 * - Rejects multicast (I/G bit set) and the all-zero address for a WAN MAC.
 */

export class InvalidMacError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMacError";
  }
}

/** Strip separators and lowercase. Returns 12 hex chars or throws. */
function extractHex(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[\s:.-]/g, "");
  if (!/^[0-9a-f]{12}$/.test(cleaned)) {
    throw new InvalidMacError(
      "MAC address must contain exactly 12 hexadecimal characters.",
    );
  }
  return cleaned;
}

export function normaliseMac(raw: string): string {
  const hex = extractHex(raw);
  const firstOctet = parseInt(hex.slice(0, 2), 16);

  // Least-significant bit of the first octet set => multicast. WAN MAC must be
  // a unicast address.
  if ((firstOctet & 0x01) === 1) {
    throw new InvalidMacError("MAC address is multicast; a unicast WAN MAC is required.");
  }
  if (hex === "000000000000") {
    throw new InvalidMacError("The all-zero MAC address is not valid.");
  }
  if (hex === "ffffffffffff") {
    throw new InvalidMacError("The broadcast MAC address is not valid.");
  }

  return hex.match(/.{2}/g)!.join(":");
}

export function isValidMac(raw: string): boolean {
  try {
    normaliseMac(raw);
    return true;
  } catch {
    return false;
  }
}
