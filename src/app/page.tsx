"use client";

import React from "react";
import { useState, useRef } from "react";
import { calculateSaltedSHA256, generateSecureSalt } from "./utils/fileHash";

export default function Home(): React.ReactNode {
    const [hash, setHash] = useState<string>("");
    const [salt, setSalt] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File): Promise<void> => {
        setIsCalculating(true);
        setFileName(file.name);
        setHash("");
        setSalt("");

        try {
            // Generate a secure random salt
            const generatedSalt = await generateSecureSalt();
            setSalt(generatedSalt);

            // Calculate salted hash
            const calculatedHash = await calculateSaltedSHA256(file, generatedSalt);
            setHash(calculatedHash);
        } catch {
            setHash("Error calculating hash");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;
        await processFile(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
    };

    const copyToClipboard = async (): Promise<void> => {
        if (hash) {
            try {
                await navigator.clipboard.writeText(hash);
                // Add a toast notification here
            } catch {}
        }
    };

    const submitToServer = async (): Promise<void> => {
        if (!hash) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stamp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ hash }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            // Add the salt to the proof data (don't send salt to server)
            const proofWithSalt = {
                ...data,
                salt: salt,
            };

            // Create and download the JSON file
            const blob = new Blob([JSON.stringify(proofWithSalt, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.proof.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Stamp a File
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Select a file to calculate its salted SHA256 hash. A secure random salt will
                        be generated in your browser and combined with the file bytes before
                        hashing. The file will be processed locally in your browser and the hash
                        will be sent to the server for inclusion in a block. Once included, you can
                        prove that the file existed at the time of the block.
                    </p>

                    <div
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept="*/*"
                        />

                        <div className="space-y-4">
                            <div className="text-6xl text-gray-400 dark:text-gray-500">📁</div>
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {fileName
                                        ? fileName
                                        : "Click to select a file or drag and drop"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {fileName ? "File selected" : "No file selected"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isCalculating && (
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <span>Generating salt and calculating salted SHA256 hash...</span>
                            </div>
                        </div>
                    )}

                    {hash && !isCalculating && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Salt (32 bytes):
                                </label>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-sm break-all">
                                    {salt}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Salted SHA256 Hash:
                                </label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-sm break-all">
                                        {hash}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Copy Hash
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={submitToServer}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Submitting to server...</span>
                                        </div>
                                    ) : (
                                        "Submit to Server & Download Proof"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
                        <p>
                            🔒 The file is processed locally in your browser and never uploaded to
                            any server. The salt is generated securely in your browser and only the
                            salted hash is sent to the server.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
