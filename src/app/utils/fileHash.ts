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
