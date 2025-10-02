"use client";

import React from "react";

export default function Footer(): React.ReactNode {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        ChiaStamp. Proof of Existence on the Chia Blockchain.
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    "xch1fstqshrv2y702jfn3xwrfhx8j5264wx3l0j5pxkhqwhavvygf72q45xq9v",
                                );
                            }}
                            className="font-mono text-sm cursor-pointer"
                            title="Click to copy donation address"
                        >
                            xch1fstqshrv2y702jfn3xwrfhx8j5264wx3l0j5pxkhqwhavvygf72q45xq9v
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
