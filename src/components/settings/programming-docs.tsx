"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, ChevronDown, ChevronUp, Code } from "lucide-react";
import { programmingDocs } from "@/lib/docs-content";

export function ProgrammingDocs() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div
                className="p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Code size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Programación y Documentación
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Detalles técnicos, diagramas y arquitectura del sistema.
                    </p>
                </div>
                <button
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                >
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
            </div>

            {isOpen && (
                <div className="p-6 bg-background dark:bg-card">
                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {programmingDocs}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
