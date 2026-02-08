// --- Common/Shared Types ---

export interface ComparisonResult {
  value: number
  previous: number
  delta: number // Percentage
  trend: "up" | "down" | "neutral"
}

export interface MetricComparison {
  current: number
  comparison: ComparisonResult
}

// --- Component Props Interfaces ---

export interface DateRange {
  from: Date
  to: Date
}

// --- AI Types ---
export interface InsightResponse {
  insight: string
  actionableTip: string
}

export type PeriodComparison = "prev_day" | "prev_week" | "prev_month" | "prev_year"
