/**
 * Generates a secure random salt using crypto.getRandomValues
 * @param length - Length of the salt in bytes (default: 32)
 * @returns Promise<string> - The salt as a hexadecimal string
 */
export const generateSecureSalt = async (length: number = 32): Promise<string> => {
    const saltBytes = new Uint8Array(length);
    crypto.getRandomValues(saltBytes);
    return Array.from(saltBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

/**
 * Calculates the SHA256 hash of a file
 * @param file - The file to calculate the hash for
 * @returns Promise<string> - The SHA256 hash as a hexadecimal string
 */
export const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Calculates the SHA256 hash of a file with a salt
 * @param file - The file to calculate the hash for
 * @param salt - The salt to append to the file bytes (hex string)
 * @returns Promise<string> - The SHA256 hash as a hexadecimal string
 */
export const calculateSaltedSHA256 = async (file: File, salt: string): Promise<string> => {
    const fileBuffer = await file.arrayBuffer();
    const saltBuffer = hexStringToUint8Array(salt);

    // Combine file bytes + salt
    const combinedBuffer = new Uint8Array(fileBuffer.byteLength + saltBuffer.length);
    combinedBuffer.set(new Uint8Array(fileBuffer), 0);
    combinedBuffer.set(saltBuffer, fileBuffer.byteLength);

    const hashBuffer = await crypto.subtle.digest("SHA-256", combinedBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Converts a hex string to Uint8Array
 * @param hex - Hex string
 * @returns Uint8Array representation
 */
const hexStringToUint8Array = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};
