"use client";

import React, { useState, useRef, useEffect } from "react";
import { calculateSHA256 } from "../utils/fileHash";
import { parseProofFile } from "../utils/proofParser";
import { verifyFileHash, verifyLocalProof, verifyOnChainCommitment } from "../utils/verification";
import type { ProofResponse } from "../types/proof";
import type { VerificationResult } from "../utils/verification";

export default function VerifyPage(): React.ReactNode {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [originalFileHash, setOriginalFileHash] = useState<string>("");
    const [isCalculatingHash, setIsCalculatingHash] = useState<boolean>(false);
    const [proofData, setProofData] = useState<ProofResponse | null>(null);
    const [proofParseError, setProofParseError] = useState<string>("");
    const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
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
            await handleProofFileParse(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
    };

    // Run verification when both file hash and proof data are available
    useEffect(() => {
        const runVerification = async (): Promise<void> => {
            if (originalFileHash && proofData) {
                const results: VerificationResult[] = [];

                // Verify file hash matches leaf hash
                const fileHashResult = verifyFileHash(originalFileHash, proofData);
                results.push(fileHashResult);

                // Only proceed with local proof verification if file hash matches
                if (fileHashResult.passed) {
                    const localProofResult = await verifyLocalProof(proofData);
                    results.push(localProofResult);

                    // Only proceed with on-chain verification if local proof is valid
                    if (localProofResult.passed) {
                        const onChainResult = verifyOnChainCommitment(proofData);
                        results.push(onChainResult);
                    } else {
                        // Add placeholder for on-chain verification
                        results.push({
                            step: "On-Chain Commitment",
                            passed: false,
                            message: "Cannot verify on-chain commitment: local proof is invalid",
                        });
                    }
                } else {
                    // Add placeholders for subsequent verifications
                    results.push({
                        step: "Local Proof",
                        passed: false,
                        message: "Cannot verify local proof: file hash does not match",
                    });
                    results.push({
                        step: "On-Chain Commitment",
                        passed: false,
                        message: "Cannot verify on-chain commitment: file hash does not match",
                    });
                }

                setVerificationResults(results);
            } else {
                setVerificationResults([]);
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
                    {verificationResults.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                Verification Results:
                            </h3>
                            <div className="space-y-2">
                                {verificationResults.map((result, index) => (
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
