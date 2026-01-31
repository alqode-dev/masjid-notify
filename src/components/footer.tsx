"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full py-6 px-4 text-center border-t border-border/50"
    >
      <p className="text-sm text-muted-foreground">
        Powered by{" "}
        <a
          href="https://alqode.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Alqode
        </a>
      </p>
    </motion.footer>
  );
}
