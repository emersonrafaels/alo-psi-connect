import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

interface RescheduleReasonSelectProps {
  value: string
  onChange: (value: string) => void
}

const PREDEFINED_REASONS = [
  { value: "conflict", label: "Conflito de agenda" },
  { value: "work_change", label: "Mudança de horário de trabalho" },
  { value: "travel", label: "Viagem ou compromisso" },
  { value: "prefer_other", label: "Prefiro outro profissional" },
  { value: "health", label: "Problema de saúde" },
  { value: "other", label: "Outro motivo" },
]

export const RescheduleReasonSelect = ({ value, onChange }: RescheduleReasonSelectProps) => {
  const [selectedReason, setSelectedReason] = useState("")
  const [otherReason, setOtherReason] = useState("")

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason)
    if (reason !== "other") {
      const label = PREDEFINED_REASONS.find(r => r.value === reason)?.label || ""
      onChange(label)
      setOtherReason("")
    } else {
      onChange(otherReason)
    }
  }

  const handleOtherReasonChange = (text: string) => {
    setOtherReason(text)
    onChange(text)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm text-muted-foreground">
          Por que você está reagendando? (opcional)
        </Label>
        <Select value={selectedReason} onValueChange={handleReasonChange}>
          <SelectTrigger id="reason" className="bg-background">
            <SelectValue placeholder="Selecione um motivo" />
          </SelectTrigger>
          <SelectContent>
            {PREDEFINED_REASONS.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedReason === "other" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label htmlFor="other-reason" className="text-sm text-muted-foreground">
            Descreva o motivo
          </Label>
          <Textarea
            id="other-reason"
            placeholder="Digite aqui o motivo do reagendamento..."
            value={otherReason}
            onChange={(e) => handleOtherReasonChange(e.target.value)}
            className="resize-none h-20 bg-background"
          />
        </div>
      )}
    </div>
  )
}
