"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, onChange, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const descriptionId = description ? `${id}-description` : undefined;

    return (
      <label
        htmlFor={id}
        className={cn("flex items-start gap-3 cursor-pointer group", className)}
      >
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only"
            aria-describedby={descriptionId}
            {...props}
          />
          <motion.div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
              checked
                ? "bg-primary border-primary"
                : "border-input group-hover:border-primary/50"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check
                    className="w-3 h-3 text-primary-foreground"
                    strokeWidth={3}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="flex-1">
          <span className="text-foreground font-medium">{label}</span>
          {description && (
            <p id={descriptionId} className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
