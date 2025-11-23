import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Buscar productos...",
  className = ""
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-11 md:h-10 text-base md:text-sm"
          aria-label="Buscar productos"
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};
