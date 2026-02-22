import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<ComponentProps<"input">, "onChange" | "value"> {
  value?: number[]
  onValueChange?: (value: number[]) => void
}

function Slider({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const currentValue = value?.[0] ?? Number(min)

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={cn(
        "w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary accent-primary",
        className
      )}
      {...props}
    />
  )
}

export { Slider }
