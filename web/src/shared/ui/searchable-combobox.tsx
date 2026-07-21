import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

function normalize(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Yazarak aranan sade combobox — native select gibi ilk harf atlamaz. */
export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Ara…",
  emptyLabel = "Sonuç yok",
  className,
  disabled,
  allowClear = true,
}: SearchableComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
    }
  }, [open, selected?.label, value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) =>
      normalize(o.searchText ?? o.label).includes(q),
    );
  }, [options, query]);

  const pick = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="flex gap-1">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          className="w-full rounded border border-border px-3 py-2"
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? query)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.label ?? query);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery(selected?.label ?? "");
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length === 1) pick(filtered[0]);
            }
          }}
        />
        {allowClear && value ? (
          <button
            type="button"
            className="rounded border border-border px-2 text-sm text-muted-foreground"
            onClick={clear}
            aria-label="Temizle"
          >
            ×
          </button>
        ) : null}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                    o.value === value && "bg-muted font-medium",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
