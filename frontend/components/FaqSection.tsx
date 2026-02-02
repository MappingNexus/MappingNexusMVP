import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        question: "How does MappingNexus ensure data security?",
        answer: "We utilize enterprise-grade encryption for all data at rest and in transit. Our infrastructure is built on secure, compliant servers with strict role-based access controls to ensure your workforce data remains protected."
    },
    {
        question: "Can I integrate with my existing HR systems?",
        answer: "Yes, MappingNexus supports API-based ingestion layers that can connect with major HRIS platforms. Our 'DataIngestion' module allows for seamless CSV uploads and direct data mapping."
    },
    {
        question: "What differentiates the VIP/Enterprise plan?",
        answer: "VIP users get access to the Admin Center, advanced analytics, priority global support (24/7), and increased limits on employee records. It also includes dedicated account management."
    },
    {
        question: "Is there a limit to the number of employees I can map?",
        answer: "Our standard plan supports up to 250 employees. For larger organizations, our Enterprise tier offers unlimited scaling to thousands of records with optimized performance."
    }
];

export const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 bg-zinc-50 dark:bg-[#080808] transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <span className="text-blue-600 dark:text-blue-500 font-mono text-xs tracking-widest uppercase mb-4 block">
                        System Knowledge Base
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-6 transition-colors">
                        Frequently Asked <span className="text-zinc-500 dark:text-zinc-500">Questions</span>
                    </h2>
                    <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="group border border-zinc-200 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-900/20 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                            >
                                <span className={`font-medium text-lg transition-colors ${openIndex === index ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                                    {faq.question}
                                </span>
                                <div className={`p-2 rounded-full border transition-all ${openIndex === index ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white'}`}>
                                    {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-6 pt-0 text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800/50 border-dashed">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
