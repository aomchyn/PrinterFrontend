'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnClickOutside?: boolean;
    closeOnEsc?: boolean;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnClickOutside = true,
    closeOnEsc = true,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                closeOnClickOutside &&
                modalRef.current &&
                !modalRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        // ป้องกันการ scroll ข้างหลัง
        document.body.style.overflow = 'hidden';

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, closeOnEsc, closeOnClickOutside]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full', // ใช้ร่วมกับ mx-4
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
            {/* คลิกพื้นหลังปิด (ถ้าเปิดไว้) */}
            {closeOnClickOutside && (
                <div className="absolute inset-0" onClick={onClose} />
            )}

            {/* ตัว Modal */}
            <div
                ref={modalRef}
                className={`
                    relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl 
                    w-full md:mx-4 
                    ${sizeClasses[size]} 
                    max-h-[90vh] overflow-y-auto
                    animate-slide-up md:animate-fade-in
                    p-6
                `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        {title && (
                            <h3 className="text-xl font-bold text-gray-800">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition touch-target"
                                aria-label="ปิด"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="text-gray-700">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;