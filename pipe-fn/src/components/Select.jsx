import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  required = false,
  className = "",
  name,
  id,
  "aria-label": ariaLabel,
}) {
  const rootRef = useRef(null);
  const faceRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useLayoutEffect(() => {
    if (!open || disabled || !faceRef.current) return undefined;

    const updateMenuPosition = () => {
      const rect = faceRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 8;
      const gap = 8;
      const estimatedHeight = Math.min(options.length * 46 + 12, 320);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openUp = spaceBelow < Math.min(estimatedHeight, 180) && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(320, openUp ? spaceAbove - gap : spaceBelow - gap));

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        top: openUp ? Math.max(viewportPadding, rect.top - gap - Math.min(estimatedHeight, maxHeight)) : rect.bottom + gap,
        width: rect.width,
        maxHeight,
        zIndex: 9999,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, disabled, options.length]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function selectOption(option) {
    if (option.disabled) return;
    // Keep the public Select API value-first for existing form handlers.
    onChange?.(option.value);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`custom-select relative ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`}>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => setOpen((current) => !current)}
        ref={faceRef}
        className="custom-select-face w-full text-left"
      >
        <span className={selected ? "custom-select-value" : "custom-select-placeholder"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`custom-select-chevron ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="select-menu custom-select-menu overflow-y-auto rounded-2xl p-1.5"
          style={menuStyle}
          role="listbox"
          aria-label={ariaLabel || placeholder}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => selectOption(option)}
                className={`select-menu-item flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${isSelected ? "is-selected" : ""} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected ? <Check size={16} className="shrink-0 text-emerald-500" /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Select;
