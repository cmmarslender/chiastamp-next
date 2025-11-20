import React from "react";
import Link from "next/link";

export default function AboutPage(): React.ReactNode {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        About ChiaStamp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        A privacy-first tool for file verification on the Chia blockchain
                    </p>

                    <div className="space-y-8">
                        {/* Overview Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Overview
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                ChiaStamp allows you to upload any file and instantly get a
                                blockchain timestamp proof. This proof demonstrates that your file
                                existed at a specific point in time without ever exposing its
                                contents. The entire process is designed with privacy as the top
                                priority.
                            </p>
                        </section>

                        {/* Privacy-First Design Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Privacy-First Design
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                        Local Processing
                                    </h3>
                                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                                        Files are hashed locally in your browser using Web Crypto
                                        API. Your file never leaves your device—not even
                                        temporarily.
                                    </p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                                    <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                                        Only Hashes Are Transmitted
                                    </h3>
                                    <p className="text-green-800 dark:text-green-300 text-sm">
                                        Nothing but the hash ever leaves your device. Even if
                                        someone intercepts the network traffic, they can only see a
                                        hash value, which cannot be reversed to reveal your file
                                        contents.
                                    </p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded">
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                                        Salted Hashing
                                    </h3>
                                    <p className="text-purple-800 dark:text-purple-300 text-sm">
                                        Each file is hashed with a secure random salt generated in
                                        your browser. This adds an extra layer of privacy by
                                        ensuring that even identical files produce different hashes,
                                        preventing correlation attacks.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Two-Stage Proof System Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Two-Stage Proof System
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Stage 1: Partial Proof
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                        When you first submit a file hash, you receive a partial
                                        proof. This proof contains:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                        <li>Information about your file hash</li>
                                        <li>Details about sibling hashes in the Merkle tree</li>
                                        <li>
                                            Proof that your hash is included in the pending batch
                                        </li>
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                                        However, this proof doesn&apos;t yet know which block the
                                        commitment will be included in, as the batch is still being
                                        prepared.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Stage 2: Full Proof (Confirmed)
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                        Once a batch is created and committed to the blockchain, you
                                        can obtain a full proof. Currently, a batch is created every
                                        5 minutes if there isn&apos;t a minimum number of spends
                                        (this timing may change in the future and is not a
                                        blockchain restriction). This confirmed proof includes:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                        <li>All information from the partial proof</li>
                                        <li>The block hash where the commitment was included</li>
                                        <li>The coin ID and transaction details</li>
                                        <li>
                                            Complete Merkle proof path for on-chain verification
                                        </li>
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                                        This is the proof you&apos;ll want to retain long-term, as
                                        it provides complete cryptographic evidence of your
                                        file&apos;s existence at a specific point in time.
                                    </p>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>Tip:</strong> Use the{" "}
                                        <Link
                                            href="/verify"
                                            className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                                        >
                                            Verify
                                        </Link>{" "}
                                        section to check if your partial proof has been updated to a
                                        full confirmed proof. The system will automatically download
                                        the updated proof if one is available.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* How It Works Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                How It Works
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            File Selection
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Select any file from your device. The file is read
                                            entirely in your browser.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            Local Hashing
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            A secure random salt is generated and combined with your
                                            file bytes. The salted file is then hashed using SHA-256
                                            in your browser. The salt is saved with your proof for
                                            later verification.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            Hash Submission
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Only the hash (not your file) is sent to the server. The
                                            server adds your hash to a Merkle tree batch that will
                                            be committed to the Chia blockchain.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            Proof Generation
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            You receive a partial proof immediately, which is
                                            downloaded as a JSON file. This proof contains the
                                            Merkle tree structure and your position within it.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        5
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            Blockchain Commitment
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Currently, a batch is created every 5 minutes if there
                                            isn&apos;t a minimum number of spends (this timing may
                                            change in the future and is not a blockchain
                                            restriction). Once the batch is committed to the Chia
                                            blockchain, you can retrieve the full confirmed proof
                                            that includes the block information.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        6
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            Verification
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            At any time, you can verify your proof by uploading both
                                            the original file and the proof file. The system
                                            verifies the file hash matches, validates the Merkle
                                            proof, and confirms the on-chain commitment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Technical Details Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Technical Details
                            </h2>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Hashing Algorithm
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        SHA-256 with a 32-byte cryptographically secure random salt.
                                        The salt is generated using the Web Crypto API&apos;s
                                        <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">
                                            crypto.getRandomValues()
                                        </code>{" "}
                                        method.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Merkle Tree Structure
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        File hashes are organized into a Merkle tree, allowing
                                        efficient batch commitments to the blockchain. Each proof
                                        includes the complete Merkle path from your hash to the
                                        root.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Blockchain Integration
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        Proofs are committed to the Chia blockchain, providing
                                        immutable timestamping. The Chia blockchain&apos;s security
                                        model ensures that once committed, the proof cannot be
                                        altered or backdated.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Use Cases Section */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                Use Cases
                            </h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                <li>
                                    <strong>Intellectual Property Protection:</strong> Prove you
                                    created a work at a specific time
                                </li>
                                <li>
                                    <strong>Legal Documentation:</strong> Establish the existence of
                                    documents at a particular date
                                </li>
                                <li>
                                    <strong>Contract Verification:</strong> Timestamp agreements and
                                    contracts
                                </li>
                                <li>
                                    <strong>Research Integrity:</strong> Verify research data and
                                    findings were created at specific times
                                </li>
                                <li>
                                    <strong>Audit Trails:</strong> Create tamper-proof records of
                                    file existence
                                </li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-4">
                            <Link
                                href="/"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Stamp a File
                            </Link>
                            <Link
                                href="/verify"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Verify a Proof
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
