import type { ProofResponse } from "../types/proof";

/**
 * Parses a proof file and returns the parsed data
 * @param file - The proof file to parse
 * @returns Promise<ProofResponse> - The parsed proof data
 * @throws Error if the file cannot be parsed
 */
export const parseProofFile = async (file: File): Promise<ProofResponse> => {
    try {
        const text = await file.text();
        const parsedData: ProofResponse = JSON.parse(text);
        return parsedData;
    } catch {
        throw new Error("Failed to parse proof file. Please ensure it's a valid JSON file.");
    }
};
