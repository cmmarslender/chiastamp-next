"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation(): React.ReactNode {
    const pathname = usePathname();

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                ChiaStamp
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-8">
                        <Link
                            href="/"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                pathname === "/"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                    : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            Stamp
                        </Link>
                        <Link
                            href="/verify"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                pathname === "/verify"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                    : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            Verify
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
