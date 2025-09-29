"use client";

import React from "react";
import { useState, useRef } from "react";

export default function Home(): React.ReactNode {
    const [hash, setHash] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const calculateSHA256 = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const processFile = async (file: File): Promise<void> => {
        setIsCalculating(true);
        setFileName(file.name);
        setHash("");

        try {
            const calculatedHash = await calculateSHA256(file);
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ChiaStamp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Select a file to calculate its SHA256 hash. The file will be processed
                        locally in your browser and the hash will be sent to the server for
                        inclusion in a block. Once included, you can prove that the file existed at
                        the time of the block.
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
                                <span>Calculating SHA256 hash...</span>
                            </div>
                        </div>
                    )}

                    {hash && !isCalculating && (
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                SHA256 Hash:
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-sm break-all">
                                    {hash}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
                        <p>
                            🔒 The file is processed locally in your browser and never uploaded to
                            any server.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
