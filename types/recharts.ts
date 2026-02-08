// --- Recharts Tooltip Types ---

export interface RechartsPayloadEntry {
  name: string
  value: number
  color?: string
  dataKey?: string
  payload?: Record<string, unknown>
}

export interface RechartsTooltipProps {
  active?: boolean
  payload?: RechartsPayloadEntry[]
  label?: string
}
