"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ModelParametersProps {
  temperature: number
  maxTokens?: number
  onTemperatureChange: (value: number) => void
  onMaxTokensChange: (value: number | undefined) => void
}

export function ModelParameters({
  temperature,
  maxTokens,
  onTemperatureChange,
  onMaxTokensChange,
}: ModelParametersProps) {
  const [maxTokensInput, setMaxTokensInput] = useState(
    maxTokens?.toString() || ""
  )

  const handleMaxTokensBlur = () => {
    if (maxTokensInput.trim() === "") {
      onMaxTokensChange(undefined)
      return
    }
    const value = parseInt(maxTokensInput, 10)
    if (!isNaN(value) && value > 0) {
      onMaxTokensChange(value)
    } else {
      setMaxTokensInput(maxTokens?.toString() || "")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={(value) => onTemperatureChange(value[0])}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Controls randomness. Lower values make responses more focused and
          deterministic.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxTokens">Max Tokens (optional)</Label>
        <Input
          id="maxTokens"
          type="number"
          min={1}
          max={32000}
          value={maxTokensInput}
          onChange={(e) => setMaxTokensInput(e.target.value)}
          onBlur={handleMaxTokensBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleMaxTokensBlur()
            }
          }}
          placeholder="No limit"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of tokens to generate. Leave empty for no limit.
        </p>
      </div>
    </div>
  )
}






