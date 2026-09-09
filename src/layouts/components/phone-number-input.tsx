"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Globe2 } from "lucide-react"
import PhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input"
import phoneCountryFlags from "react-phone-number-input/flags"
import "react-phone-number-input/style.css"

import { cn } from "/src/layouts/components/lib/utils"
import { Button } from "/src/layouts/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "/src/layouts/components/ui/command"
import { Input, inputClassName } from "/src/layouts/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "/src/layouts/components/ui/popover"

type CountryOption = {
  value?: Country
  label: string
  divider?: boolean
}

type CountrySelectProps = {
  value?: Country
  onChange: (value?: Country) => void
  onFocus?: () => void
  onBlur?: () => void
  options: CountryOption[]
  iconComponent?: React.ElementType
  disabled?: boolean
  readOnly?: boolean
  tabIndex?: number | string
  "aria-label"?: string
}

function SearchableCountrySelect({
  value,
  onChange,
  onFocus,
  onBlur,
  options,
  disabled,
  readOnly,
  tabIndex,
  "aria-label": ariaLabel = "Phone country",
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectableOptions = options.filter((option) => !option.divider)
  const selectedOption = selectableOptions.find(
    (option) => option.value === value
  )
  const selectedLabel = selectedOption?.label ?? "International"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-label={`${ariaLabel}: ${selectedLabel}`}
          aria-expanded={open}
          disabled={disabled || readOnly}
          tabIndex={typeof tabIndex === "string" ? Number(tabIndex) : tabIndex}
          onFocus={() => onFocus?.()}
          onBlur={() => onBlur?.()}
          className="h-full shrink-0 gap-1 rounded-none border-0 border-r border-input bg-transparent px-2.5 py-0 shadow-none hover:bg-accent focus-visible:border-0 focus-visible:ring-0"
        >
          <CountryFlag country={value} label={selectedLabel} size="trigger" />
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
      >
        <Command>
          <CommandInput placeholder="Search Countries..." className="h-9" />
          <CommandList>
            <CommandEmpty>No countries found.</CommandEmpty>
            <CommandGroup>
              {selectableOptions.map((option) => {
                const optionLabel = option.label || "International"

                return (
                  <CommandItem
                    key={option.value ?? "international"}
                    value={optionLabel}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className="gap-3 text-card-foreground"
                  >
                    <CountryFlag
                      country={option.value}
                      label={optionLabel}
                      size="menu"
                    />
                    <span className="truncate">{optionLabel}</span>
                    <Check
                      className={cn(
                        "ml-auto size-4 shrink-0",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type FlagSvgProps = React.SVGProps<SVGSVGElement> & {
  title?: string
}

function CountryFlag({
  country,
  label,
  size,
}: {
  country?: Country
  label: string
  size: "trigger" | "menu"
}) {
  const dimensions = size === "trigger" ? "h-6 w-9" : "h-5 w-[1.875rem]"

  if (!country) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          dimensions
        )}
      >
        <Globe2 className={size === "trigger" ? "size-6" : "size-5"} />
      </span>
    )
  }

  const Flag = phoneCountryFlags[country] as
    | React.ComponentType<FlagSvgProps>
    | undefined

  if (!Flag) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/30",
        dimensions
      )}
    >
      <Flag title={label} className="block size-full" />
    </span>
  )
}

const PhoneNumberTextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    {...props}
    ref={ref}
    className={cn(
      "h-full rounded-none border-0 bg-transparent px-3 py-1 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent",
      className
    )}
  />
))
PhoneNumberTextInput.displayName = "PhoneNumberTextInput"

type PhoneNumberInputProps = Omit<
  React.ComponentProps<typeof PhoneInput>,
  "className" | "countrySelectComponent" | "flags" | "inputComponent"
> & {
  className?: string
}

function PhoneNumberInput({ className, style, ...props }: PhoneNumberInputProps) {
  return (
    <PhoneInput
      {...props}
      className={cn(
        inputClassName,
        "overflow-hidden p-0 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
      style={style}
      countrySelectComponent={SearchableCountrySelect}
      inputComponent={PhoneNumberTextInput}
    />
  )
}

export {
  PhoneNumberInput,
  type Country as PhoneCountry,
  type Value as PhoneValue,
}
