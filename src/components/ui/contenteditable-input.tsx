import * as React from "react";
import { cn } from "@/lib/utils";

interface ContentEditableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  maxLength?: number;
  multiline?: boolean;
}

/**
 * Contenteditable-based input that prevents Android Autofill from triggering.
 * Android's Autofill Framework ignores contenteditable divs.
 */
const ContentEditableInput = React.forwardRef<HTMLDivElement, ContentEditableInputProps>(
  ({ value, onChange, placeholder, disabled, className, onKeyDown, onFocus, onBlur, maxLength, multiline = false }, ref) => {
    const innerRef = React.useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement | null) => {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    // Sync external value → DOM (only when not focused to avoid cursor jump)
    const isFocused = React.useRef(false);
    React.useEffect(() => {
      if (!isFocused.current && innerRef.current) {
        const current = innerRef.current.textContent || "";
        if (current !== value) {
          innerRef.current.textContent = value;
        }
      }
    }, [value]);

    return (
      <div
        ref={combinedRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={multiline ? "true" : "false"}
        aria-label={placeholder}
        data-placeholder={placeholder}
        onFocus={() => {
          isFocused.current = true;
          onFocus?.();
        }}
        onBlur={() => {
          isFocused.current = false;
          onBlur?.();
        }}
        onInput={(e) => {
          const text = (e.currentTarget as HTMLDivElement).textContent || "";
          if (maxLength && text.length > maxLength) {
            e.currentTarget.textContent = text.slice(0, maxLength);
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(e.currentTarget);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
            return;
          }
          onChange(text);
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
          }
          onKeyDown?.(e);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          const trimmed = maxLength ? text.slice(0, maxLength) : text;
          document.execCommand("insertText", false, trimmed);
        }}
        className={cn(
          // base - use block not flex so contenteditable renders text correctly
          "block w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // placeholder via ::before pseudo-element
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none empty:before:select-none",
          multiline
            ? "min-h-[80px] overflow-y-auto"
            : "h-10 overflow-hidden whitespace-nowrap leading-[24px]", // 24px line-height + 8px padding top/bottom = 40px
          disabled ? "cursor-not-allowed opacity-50" : "",
          "md:text-sm",
          className,
        )}
      />
    );
  }
);

ContentEditableInput.displayName = "ContentEditableInput";

export { ContentEditableInput };
