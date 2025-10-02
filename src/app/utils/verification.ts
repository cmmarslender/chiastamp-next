import type { ProofResponse } from "../types/proof";
import { Position } from "../types/proof";
import { calculateSaltedSHA256 } from "./fileHash";

export interface VerificationResult {
    step: string;
    passed: boolean;
    message: string;
    timestamp?: number; // Unix timestamp for on-chain verification
    blockIndex?: number; // Block index for on-chain verification
    failureReason?: "missing-data" | "invalid-data" | "api-error"; // Reason for failure
}

export interface VerificationResults {
    fileHashMatch: VerificationResult | null;
    localProof: VerificationResult | null;
    onChainVerification: VerificationResult | null;
}

interface CoinRecord {
    coin: {
        parent_coin_info: string;
        puzzle_hash: string;
        amount: number;
    };
    coinbase: boolean;
    confirmed_block_index: number;
    spent: boolean;
    spent_block_index: number;
    timestamp: number;
}

interface CoinsetResponse {
    coin_records: CoinRecord[];
    success: boolean;
}

interface BlockRecord {
    header_hash: string;
    height: number;
    [key: string]: unknown; // Allow other fields we don't need to type
}

interface BlockRecordResponse {
    block_record: BlockRecord;
    success: boolean;
    error?: string;
}

/**
 * Formats a time delta in seconds into a human-readable string
 * @param deltaSeconds - Time difference in seconds
 * @returns Human-readable time string (e.g., "2 hours ago", "3 days ago")
 */
const formatTimeDelta = (deltaSeconds: number): string => {
    const minutes = Math.floor(deltaSeconds / 60);
    const hours = Math.floor(deltaSeconds / 3600);
    const days = Math.floor(deltaSeconds / 86400);
    const weeks = Math.floor(deltaSeconds / 604800);
    const months = Math.floor(deltaSeconds / 2592000); // ~30 days
    const years = Math.floor(deltaSeconds / 31536000); // ~365 days

    if (years > 0) {
        return `${years} year${years === 1 ? "" : "s"} ago`;
    } else if (months > 0) {
        return `${months} month${months === 1 ? "" : "s"} ago`;
    } else if (weeks > 0) {
        return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    } else if (days > 0) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    } else {
        return "just now";
    }
};

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
 * Verifies that the salted file hash matches the leaf_hash in the proof
 * @param file - The file to verify
 * @param proof - The parsed proof data containing the salt
 * @returns Promise<VerificationResult> indicating if the salted hashes match
 */
export const verifySaltedFileHash = async (
    file: File,
    proof: ProofResponse,
): Promise<VerificationResult> => {
    if (!proof.salt) {
        return {
            step: "Salted File Hash Match",
            passed: false,
            message: "Proof does not contain salt information",
        };
    }

    try {
        const calculatedSaltedHash = await calculateSaltedSHA256(file, proof.salt);
        const hashMatch = calculatedSaltedHash.toLowerCase() === proof.leaf_hash.toLowerCase();

        return {
            step: "Salted File Hash Match",
            passed: hashMatch,
            message: hashMatch
                ? "Salted file hash matches the proof leaf hash"
                : `Salted file hash (${calculatedSaltedHash}) does not match proof leaf hash (${proof.leaf_hash})`,
        };
    } catch (error) {
        return {
            step: "Salted File Hash Match",
            passed: false,
            message: `Error calculating salted hash: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
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
 * Verifies if the proof made it to a block (on-chain commitment and coinset verification)
 * @param proof - The parsed proof data
 * @returns Promise<VerificationResult> indicating if the proof is confirmed on-chain
 */
export const verifyOnChainVerification = async (
    proof: ProofResponse,
): Promise<VerificationResult> => {
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
            step: "On-Chain Verification",
            passed: false,
            message: `Cannot verify on-chain: missing or invalid fields (${missingFields.join(", ")})`,
            failureReason: "missing-data",
        };
    }

    // All fields are present, now verify against coinset
    try {
        // Call the coinset API to get coin records by hint
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_COINSET_BASE}/get_coin_records_by_hint`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    hint: proof.root_hash,
                    include_spent_coins: true,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`Coinset API responded with status: ${response.status}`);
        }

        const data: CoinsetResponse = await response.json();

        if (!data.success || !data.coin_records) {
            return {
                step: "On-Chain Verification",
                passed: false,
                message: "Coinset API returned unsuccessful response",
                failureReason: "api-error",
            };
        }

        // Check if at least one coin has a parent_coin_info that matches the coin_id
        // Strip "0x" prefix from parent_coin_info if present before comparing
        const matchingCoin = data.coin_records.find((record: CoinRecord) => {
            const parentCoinInfo = record.coin?.parent_coin_info;
            if (!parentCoinInfo) return false;

            // Strip "0x" prefix if present
            const normalizedParentCoinInfo = parentCoinInfo.startsWith("0x")
                ? parentCoinInfo.substring(2)
                : parentCoinInfo;

            return normalizedParentCoinInfo === proof.coin_id;
        });

        if (matchingCoin) {
            // Now verify the header hash matches the block record
            const blockResponse = await fetch(
                `${process.env.NEXT_PUBLIC_COINSET_BASE}/get_block_record_by_height`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        height: matchingCoin.confirmed_block_index,
                    }),
                },
            );

            if (!blockResponse.ok) {
                throw new Error(`Block record API responded with status: ${blockResponse.status}`);
            }

            const blockData: BlockRecordResponse = await blockResponse.json();

            if (!blockData.success || !blockData.block_record) {
                return {
                    step: "On-Chain Verification",
                    passed: false,
                    message: "Block record API returned unsuccessful response",
                    failureReason: "api-error",
                };
            }

            // Check if the header hash matches
            const blockHeaderHash = blockData.block_record.header_hash;
            const normalizedBlockHeaderHash = blockHeaderHash.startsWith("0x")
                ? blockHeaderHash.substring(2)
                : blockHeaderHash;
            const normalizedProofHeaderHash = proof.header_hash?.startsWith("0x")
                ? proof.header_hash?.substring(2)
                : proof.header_hash;

            if (
                normalizedBlockHeaderHash === normalizedProofHeaderHash &&
                normalizedProofHeaderHash !== undefined &&
                normalizedBlockHeaderHash !== undefined
            ) {
                // Calculate time delta for when the file was included in the block
                const blockTimestamp = matchingCoin.timestamp;
                const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
                const timeDelta = currentTime - blockTimestamp;
                const timeAgo = formatTimeDelta(timeDelta);

                return {
                    step: "On-Chain Verification",
                    passed: true,
                    message: `Proof fully verified on-chain: coin ID ${proof.coin_id} found in block ${matchingCoin.confirmed_block_index} with matching header hash and merkle root. File was included in block ${timeAgo}.`,
                    timestamp: blockTimestamp,
                    blockIndex: matchingCoin.confirmed_block_index,
                };
            } else {
                return {
                    step: "On-Chain Verification",
                    passed: false,
                    message: `Header hash mismatch: proof header hash (${proof.header_hash}) does not match block header hash (${blockHeaderHash})`,
                    failureReason: "invalid-data",
                };
            }
        } else {
            return {
                step: "On-Chain Verification",
                passed: false,
                message: `Coin ID ${proof.coin_id} not found in coinset for root hash ${proof.root_hash}`,
                failureReason: "invalid-data",
            };
        }
    } catch (error) {
        return {
            step: "On-Chain Verification",
            passed: false,
            message: `Error verifying on-chain: ${error instanceof Error ? error.message : "Unknown error"}`,
            failureReason: "api-error",
        };
    }
};

/**
 * Checks if a proof is confirmed (has all blockchain fields filled in)
 * @param proof - The proof to check
 * @returns boolean indicating if the proof is confirmed
 */
export const isProofConfirmed = (proof: ProofResponse): boolean => {
    // A proof is confirmed if it has all the blockchain fields filled in
    return (
        proof.confirmed === true &&
        proof.header_hash !== null &&
        proof.header_hash !== undefined &&
        proof.coin_id !== null &&
        proof.coin_id !== undefined
    );
};
