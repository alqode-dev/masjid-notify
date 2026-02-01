"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full py-6 px-4 text-center border-t border-border/50"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-border">|</span>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="text-border">|</span>
          <Link href="/data-deletion" className="hover:text-primary transition-colors">
            Data Deletion
          </Link>
        </div>
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
      </div>
    </motion.footer>
  );
}
