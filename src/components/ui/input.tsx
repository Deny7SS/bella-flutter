import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoComplete, name, id, onFocus, ...props }, ref) => {
    // Generate a neutral random-ish id/name to avoid login heuristics
    const neutralId = React.useId();
    const safeName = name || `field-${neutralId.replace(/:/g, "")}`;
    const safeId = id || `input-${neutralId.replace(/:/g, "")}`;
    const safeAutoComplete = autoComplete ?? "off";

    // Readonly trick: Android Autofill Framework skips readonly fields.
    // We remove readonly on first focus so the user can type normally.
    const [isReadOnly, setIsReadOnly] = React.useState(type !== "password");

    return (
      <input
        type={type || "text"}
        name={safeName}
        id={safeId}
        autoComplete={safeAutoComplete}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        readOnly={isReadOnly}
        data-1p-ignore=""
        data-lpignore="true"
        data-protonpass-ignore="true"
        data-bwignore=""
        data-form-type="other"
        data-credential="false"
        aria-autocomplete="none"
        x-autocompletetype="off"
        inputMode={type === "number" ? "numeric" : undefined}
        onFocus={(e) => {
          setIsReadOnly(false);
          onFocus?.(e);
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

