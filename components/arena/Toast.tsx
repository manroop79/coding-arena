"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export type ToastMessage = {
  id: string;
  text: string;
  tone?: "info" | "error";
};

type ToastProps = {
  message?: ToastMessage;
  onClear?: () => void;
};

export function Toast({ message, onClear }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClear?.();
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        pointerEvents: "none"
      }}
    >
      <AnimatePresence>
        {message && visible && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              pointerEvents: "auto",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background:
                message.tone === "error" ? "rgba(255, 107, 107, 0.12)" : "rgba(107, 194, 255, 0.12)",
              color: "var(--text)",
              minWidth: 220,
              boxShadow: "var(--shadow)"
            }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

