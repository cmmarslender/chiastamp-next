"use client";

import React, { useState, useRef, useEffect } from "react";
import { calculateSHA256 } from "../utils/fileHash";
import { parseProofFile } from "../utils/proofParser";
import { verifyFileHash, verifyLocalProof, verifyOnChainCommitment } from "../utils/verification";
import type { ProofResponse } from "../types/proof";
import type { VerificationResult, VerificationResults } from "../utils/verification";

export default function VerifyPage(): React.ReactNode {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [originalFileHash, setOriginalFileHash] = useState<string>("");
    const [isCalculatingHash, setIsCalculatingHash] = useState<boolean>(false);
    const [proofData, setProofData] = useState<ProofResponse | null>(null);
    const [proofParseError, setProofParseError] = useState<string>("");
    const [verificationResults, setVerificationResults] = useState<VerificationResults>({
        fileHashMatch: null,
        localProof: null,
        onChainCommitment: null,
    });
    const [isCheckingForUpdate, setIsCheckingForUpdate] = useState<boolean>(false);
    const [updateMessage, setUpdateMessage] = useState<string>("");
    const originalFileInputRef = useRef<HTMLInputElement>(null);
    const proofFileInputRef = useRef<HTMLInputElement>(null);

    const handleOriginalFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (file) {
            setOriginalFile(file);
            setOriginalFileHash("");
            setIsCalculatingHash(true);
            setUpdateMessage(""); // Reset update message when new file is selected

            try {
                const hash = await calculateSHA256(file);
                setOriginalFileHash(hash);
            } catch {
                setOriginalFileHash("Error calculating hash");
            } finally {
                setIsCalculatingHash(false);
            }
        }
    };

    const handleProofFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (file) {
            setProofFile(file);
            setUpdateMessage(""); // Reset update message when new proof file is selected
            await handleProofFileParse(file);
        }
    };

    const handleOriginalFileDrop = async (
        event: React.DragEvent<HTMLDivElement>,
    ): Promise<void> => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setOriginalFile(file);
            setOriginalFileHash("");
            setIsCalculatingHash(true);
            setUpdateMessage(""); // Reset update message when new file is dropped

            try {
                const hash = await calculateSHA256(file);
                setOriginalFileHash(hash);
            } catch {
                setOriginalFileHash("Error calculating hash");
            } finally {
                setIsCalculatingHash(false);
            }
        }
    };

    const handleProofFileDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setProofFile(file);
            setUpdateMessage(""); // Reset update message when new proof file is dropped
            await handleProofFileParse(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
    };

    const handleCheckForUpdatedProof = async (): Promise<void> => {
        if (!originalFileHash || !proofData) return;

        setIsCheckingForUpdate(true);
        setUpdateMessage("");
        try {
            // Call the API to check for updated proof
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/proof`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ hash: originalFileHash }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const updatedProof: ProofResponse = await response.json();

            // Compare the updated proof with the current proof
            const hasChanges = compareProofs(proofData, updatedProof);

            if (hasChanges) {
                // Download the new proof file
                await downloadUpdatedProof(updatedProof);
                setUpdateMessage("Updated proof downloaded successfully!");
            } else {
                // No changes found
                setUpdateMessage(
                    "No updates available for this proof. Your current proof is up to date.",
                );
            }
        } catch {
            setUpdateMessage("Error checking for updates. Please try again.");
        } finally {
            setIsCheckingForUpdate(false);
        }
    };

    const compareProofs = (currentProof: ProofResponse, updatedProof: ProofResponse): boolean => {
        // Compare all fields to detect any changes
        return (
            currentProof.confirmed !== updatedProof.confirmed ||
            currentProof.header_hash !== updatedProof.header_hash ||
            currentProof.coin_id !== updatedProof.coin_id ||
            currentProof.root_hash !== updatedProof.root_hash ||
            currentProof.leaf_hash !== updatedProof.leaf_hash ||
            JSON.stringify(currentProof.proof) !== JSON.stringify(updatedProof.proof)
        );
    };

    const downloadUpdatedProof = async (updatedProof: ProofResponse): Promise<void> => {
        if (!originalFile) return;

        // Create and download the updated JSON file
        const blob = new Blob([JSON.stringify(updatedProof, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${originalFile.name}.proof.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Check if we should show the "Check for Updated Proof" button
    const shouldShowUpdateButton = (): boolean => {
        const { fileHashMatch, localProof, onChainCommitment } = verificationResults;

        // Show button if file hash and local proof are valid, but on-chain commitment failed
        return (
            fileHashMatch?.passed === true &&
            localProof?.passed === true &&
            onChainCommitment?.passed === false
        );
    };

    // Run verification when both file hash and proof data are available
    useEffect(() => {
        const runVerification = async (): Promise<void> => {
            if (originalFileHash && proofData) {
                const results: VerificationResults = {
                    fileHashMatch: null,
                    localProof: null,
                    onChainCommitment: null,
                };

                // Verify file hash matches leaf hash
                results.fileHashMatch = verifyFileHash(originalFileHash, proofData);

                // Only proceed with local proof verification if file hash matches
                if (results.fileHashMatch.passed) {
                    results.localProof = await verifyLocalProof(proofData);

                    // Only proceed with on-chain verification if local proof is valid
                    if (results.localProof.passed) {
                        results.onChainCommitment = verifyOnChainCommitment(proofData);
                    } else {
                        // Add placeholder for on-chain verification
                        results.onChainCommitment = {
                            step: "On-Chain Commitment",
                            passed: false,
                            message: "Cannot verify on-chain commitment: local proof is invalid",
                        };
                    }
                } else {
                    // Add placeholders for subsequent verifications
                    results.localProof = {
                        step: "Local Proof",
                        passed: false,
                        message: "Cannot verify local proof: file hash does not match",
                    };
                    results.onChainCommitment = {
                        step: "On-Chain Commitment",
                        passed: false,
                        message: "Cannot verify on-chain commitment: file hash does not match",
                    };
                }

                setVerificationResults(results);
            } else {
                setVerificationResults({
                    fileHashMatch: null,
                    localProof: null,
                    onChainCommitment: null,
                });
            }
        };

        runVerification();
    }, [originalFileHash, proofData]);

    const handleProofFileParse = async (file: File): Promise<void> => {
        try {
            const parsedData = await parseProofFile(file);
            setProofData(parsedData);
            setProofParseError("");
        } catch (error) {
            setProofParseError(
                error instanceof Error ? error.message : "Failed to parse proof file.",
            );
            setProofData(null);
        } finally {
            setUpdateMessage(""); // Clear update message regardless of success or failure
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Verify
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Upload the original file and its proof to verify the timestamp.
                    </p>

                    {/* Check for Updated Proof Button */}
                    {shouldShowUpdateButton() && (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                        Proof May Be Outdated
                                    </h3>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                        The local proof is valid, but the on-chain commitment could
                                        not be verified. This might be due to missing fields in your
                                        proof file or a blockchain reorg. Check if an updated proof
                                        is available.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCheckForUpdatedProof}
                                    disabled={isCheckingForUpdate}
                                    className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    {isCheckingForUpdate ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Checking...</span>
                                        </div>
                                    ) : (
                                        "Check for Updated Proof"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Update Message */}
                    {updateMessage && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    {updateMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Original File Upload */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Original File
                            </h2>
                            <div
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                                onDrop={handleOriginalFileDrop}
                                onDragOver={handleDragOver}
                                onClick={() => originalFileInputRef.current?.click()}
                            >
                                <input
                                    ref={originalFileInputRef}
                                    type="file"
                                    onChange={handleOriginalFileChange}
                                    className="hidden"
                                    accept="*/*"
                                />

                                <div className="space-y-3">
                                    <div className="text-4xl text-gray-400 dark:text-gray-500">
                                        📄
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {originalFile
                                                ? originalFile.name
                                                : "Click to select original file"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {originalFile ? "File selected" : "or drag and drop"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Hash Display */}
                            {isCalculatingHash && (
                                <div className="mt-4 text-center">
                                    <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                        <span className="text-sm">Calculating hash...</span>
                                    </div>
                                </div>
                            )}

                            {originalFileHash && !isCalculatingHash && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        File Hash:
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-xs break-all">
                                        {originalFileHash}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Proof File Upload */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Proof File
                            </h2>
                            <div
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                                onDrop={handleProofFileDrop}
                                onDragOver={handleDragOver}
                                onClick={() => proofFileInputRef.current?.click()}
                            >
                                <input
                                    ref={proofFileInputRef}
                                    type="file"
                                    onChange={handleProofFileChange}
                                    className="hidden"
                                    accept=".json"
                                />

                                <div className="space-y-3">
                                    <div className="text-4xl text-gray-400 dark:text-gray-500">
                                        🔐
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {proofFile
                                                ? proofFile.name
                                                : "Click to select proof file"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {proofFile
                                                ? "Proof selected"
                                                : "or drag and drop (.json)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Proof Parse Error */}
                            {proofParseError && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {proofParseError}
                                    </p>
                                </div>
                            )}

                            {/* Proof Data Display */}
                            {proofData && !proofParseError && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Parsed Proof Data:
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3">
                                        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                                            {JSON.stringify(proofData, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Display */}
                    {(originalFile || proofFile) && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Files Ready:
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {originalFile && <p>✓ Original file: {originalFile.name}</p>}
                                {proofFile && <p>✓ Proof file: {proofFile.name}</p>}
                            </div>
                        </div>
                    )}

                    {/* Verification Results */}
                    {(verificationResults.fileHashMatch ||
                        verificationResults.localProof ||
                        verificationResults.onChainCommitment) && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                Verification Results:
                            </h3>
                            <div className="space-y-2">
                                {[
                                    verificationResults.fileHashMatch,
                                    verificationResults.localProof,
                                    verificationResults.onChainCommitment,
                                ]
                                    .filter(
                                        (result): result is VerificationResult => result !== null,
                                    )
                                    .map((result, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                {result.passed ? (
                                                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-green-600 dark:text-green-400"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-red-600 dark:text-red-400"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p
                                                    className={`text-sm font-medium ${result.passed ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}
                                                >
                                                    {result.step}
                                                </p>
                                                <p
                                                    className={`text-xs ${result.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                >
                                                    {result.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
                        <p>
                            🔒 Files are processed locally in your browser and never uploaded to any
                            server during verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
