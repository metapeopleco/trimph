"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { CITIES } from "@/lib/cities"

interface CityComboboxProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  allowAny?: boolean
}

export function CityCombobox({
  value,
  onChange,
  placeholder = "Select city…",
  className,
  allowAny = true,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return CITIES
    return CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  const select = (city: string) => {
    onChange(city)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="city-listbox"
          aria-haspopup="listbox"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-4 text-sm transition-colors hover:bg-accent/50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type a city…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-64 scrollbar-thin">
            <CommandEmpty>
              {allowAny && search.trim() ? (
                <button
                  type="button"
                  onClick={() => select(search.trim())}
                  className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                >
                  Use “{search.trim()}”
                </button>
              ) : (
                "No city found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 100).map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => select(city)}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === city ? "opacity-100" : "opacity-0")} />
                  {city}
                </CommandItem>
              ))}
              {filtered.length > 100 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  {filtered.length} cities — refine your search
                </div>
              )}
            </CommandGroup>
            {allowAny && search.trim() && !CITIES.includes(search.trim()) && (
              <CommandGroup heading="Custom">
                <CommandItem value={`custom-${search}`} onSelect={() => select(search.trim())} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Use “{search.trim()}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
