'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from './Loader';

export interface FullscreenLoaderProps {
  show: boolean;
  text?: string;
  subtitle?: string;
}

export const FullscreenLoader = ({
  show,
  text = 'Loading InboxIQ',
  subtitle,
}: FullscreenLoaderProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center bg-[#050810]/90 backdrop-blur-sm pointer-events-auto"
        >
          <div className="flex flex-col items-center gap-5 text-center font-sans">
            <Loader size="lg" />
            {text && (
              <p className="text-[13px] font-semibold text-zinc-400 tracking-wide">{text}</p>
            )}
            {subtitle && (
              <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed">{subtitle}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

FullscreenLoader.displayName = 'FullscreenLoader';
