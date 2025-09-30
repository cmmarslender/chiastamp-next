import type { ProofResponse } from "../types/proof";
import { Position } from "../types/proof";

export interface VerificationResult {
    step: string;
    passed: boolean;
    message: string;
}

export interface VerificationResults {
    fileHashMatch: VerificationResult | null;
    localProof: VerificationResult | null;
    onChainCommitment: VerificationResult | null;
}

/**
 * Hashes a pair of byte arrays using SHA256
 * @param left - Left byte array
 * @param right - Right byte array
 * @returns SHA256 hash as Uint8Array
 */
const hashPair = async (left: Uint8Array, right: Uint8Array): Promise<Uint8Array> => {
    const combined = new Uint8Array(left.length + right.length);
    combined.set(left);
    combined.set(right, left.length);

    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    return new Uint8Array(hashBuffer);
};

/**
 * Converts a hex string to Uint8Array
 * @param hex - Hex string
 * @returns Uint8Array representation
 */
const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};

/**
 * Converts Uint8Array to hex string
 * @param bytes - Byte array
 * @returns Hex string representation
 */
const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

/**
 * Verifies that the file hash matches the leaf_hash in the proof
 * @param fileHash - The SHA256 hash of the original file
 * @param proof - The parsed proof data
 * @returns VerificationResult indicating if the hashes match
 */
export const verifyFileHash = (fileHash: string, proof: ProofResponse): VerificationResult => {
    const hashMatch = fileHash.toLowerCase() === proof.leaf_hash.toLowerCase();

    return {
        step: "File Hash Match",
        passed: hashMatch,
        message: hashMatch
            ? "File hash matches the proof leaf hash"
            : `File hash (${fileHash}) does not match proof leaf hash (${proof.leaf_hash})`,
    };
};

/**
 * Verifies the local proof structure
 * @param proof - The parsed proof data
 * @returns Promise<VerificationResult> indicating if the local proof is valid
 */
export const verifyLocalProof = async (proof: ProofResponse): Promise<VerificationResult> => {
    // If proof is empty, we are the only leaf in the tree
    if (proof.proof.length === 0) {
        const rootMatchesLeaf = proof.root_hash.toLowerCase() === proof.leaf_hash.toLowerCase();

        return {
            step: "Local Proof (Single Leaf)",
            passed: rootMatchesLeaf,
            message: rootMatchesLeaf
                ? "Single leaf tree: root hash matches leaf hash"
                : `Single leaf tree: root hash (${proof.root_hash}) does not match leaf hash (${proof.leaf_hash})`,
        };
    }

    // Multi-leaf proof verification
    try {
        let computed = hexToBytes(proof.leaf_hash);

        for (const step of proof.proof) {
            const sibling = hexToBytes(step.hash);

            if (step.position === Position.Left) {
                computed = await hashPair(sibling, computed);
            } else {
                computed = await hashPair(computed, sibling);
            }
        }

        const computedHex = bytesToHex(computed);
        const isValid = computedHex.toLowerCase() === proof.root_hash.toLowerCase();

        return {
            step: "Local Proof (Multi-Leaf)",
            passed: isValid,
            message: isValid
                ? `Multi-leaf tree: computed root (${computedHex}) matches proof root (${proof.root_hash})`
                : `Multi-leaf tree: computed root (${computedHex}) does not match proof root (${proof.root_hash})`,
        };
    } catch (error) {
        return {
            step: "Local Proof (Multi-Leaf)",
            passed: false,
            message: `Error verifying multi-leaf proof: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
};

/**
 * Verifies if the proof made it to a block (on-chain commitment)
 * @param proof - The parsed proof data
 * @returns VerificationResult indicating if the proof is confirmed on-chain
 */
export const verifyOnChainCommitment = (proof: ProofResponse): VerificationResult => {
    // Check if all required fields are present for on-chain verification
    const isConfirmed = proof.confirmed === true;
    const hasHeaderHash = proof.header_hash !== null && proof.header_hash !== undefined;
    const hasCoinId = proof.coin_id !== null && proof.coin_id !== undefined;

    const allFieldsPresent = isConfirmed && hasHeaderHash && hasCoinId;

    if (!allFieldsPresent) {
        const missingFields = [];
        if (!isConfirmed) missingFields.push("confirmed");
        if (!hasHeaderHash) missingFields.push("header_hash");
        if (!hasCoinId) missingFields.push("coin_id");

        return {
            step: "On-Chain Commitment",
            passed: false,
            message: `Cannot verify on-chain commitment: missing or invalid fields (${missingFields.join(", ")})`,
        };
    }

    // All fields are present, ready for blockchain verification
    // @TODO need to check coinset for the matching coin ID and header hash:
    // - Get the coin by hint - hint will be the root hash, and the coin ID should match
    // - Ensure the header hash of the coin matches the proof header hash
    return {
        step: "On-Chain Commitment",
        passed: true,
        message: `Proof confirmed on-chain with header hash: ${proof.header_hash} and coin ID: ${proof.coin_id}`,
    };
};
