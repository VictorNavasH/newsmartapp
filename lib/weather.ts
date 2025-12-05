import type { WeatherDay } from "../types"
import { RESTAURANT_LOCATION } from "../constants"

export const fetchWeatherForecast = async (): Promise<WeatherDay[]> => {
  try {
    const { LAT, LON } = RESTAURANT_LOCATION

    // We fetch hourly data to pick specific times for Lunch (14:00) and Dinner (21:00)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min&hourly=weather_code&timezone=auto`,
    )

    if (!response.ok) throw new Error("Weather API Error")

    const data = await response.json()

    const forecast: WeatherDay[] = data.daily.time.map((date: string, index: number) => {
      // Determine Hourly Indices for this day
      // Each day has 24 hours. Index 0 = Day 0 00:00.
      // Lunch ~ 14:00 -> Index = index * 24 + 14
      // Dinner ~ 21:00 -> Index = index * 24 + 21
      const lunchIdx = index * 24 + 14
      const dinnerIdx = index * 24 + 21

      return {
        date: date,
        maxTemp: Math.round(data.daily.temperature_2m_max[index]),
        minTemp: Math.round(data.daily.temperature_2m_min[index]),
        lunchCode: data.hourly.weather_code[lunchIdx] || 0,
        dinnerCode: data.hourly.weather_code[dinnerIdx] || 0,
      }
    })

    return forecast
  } catch (error) {
    console.error("Failed to fetch weather", error)
    return []
  }
}

export const getWeatherIconName = (code: number): "sun" | "cloud" | "rain" | "storm" | "snow" => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0 || code === 1) return "sun"
  if (code === 2 || code === 3) return "cloud"
  if ([45, 48].includes(code)) return "cloud" // Fog
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain"
  if ([95, 96, 99].includes(code)) return "storm"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow"
  return "sun"
}
