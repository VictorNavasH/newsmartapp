// --- WEATHER TYPES ---

export interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  lunchCode: number // Weather at 14:00
  dinnerCode: number // Weather at 21:00
}
