import type { WeatherDay } from "../types"
import { supabase } from "./supabase"

const aemetToWmoCode = (aemetCode: string | null): number => {
  if (!aemetCode) return 0

  // Códigos AEMET: https://www.aemet.es/es/eltiempo/prediccion/municipios/ayuda
  // Mapeo a WMO codes usados por Open-Meteo
  const mapping: Record<string, number> = {
    // Despejado
    "11": 0,
    "11n": 0,
    // Poco nuboso
    "12": 1,
    "12n": 1,
    // Intervalos nubosos
    "13": 2,
    "13n": 2,
    "14": 2,
    "14n": 2,
    // Muy nuboso
    "15": 3,
    "15n": 3,
    // Cubierto
    "16": 3,
    "16n": 3,
    // Nubes altas
    "17": 2,
    "17n": 2,
    // Niebla
    "81": 45,
    "81n": 45,
    "82": 45,
    "82n": 45,
    // Lluvia
    "23": 61,
    "23n": 61, // Intervalos nubosos con lluvia escasa
    "24": 61,
    "24n": 61, // Nuboso con lluvia escasa
    "25": 63,
    "25n": 63, // Muy nuboso con lluvia
    "26": 65,
    "26n": 65, // Cubierto con lluvia
    "43": 61,
    "43n": 61, // Intervalos nubosos con lluvia
    "44": 63,
    "44n": 63, // Nuboso con lluvia
    "45": 65,
    "45n": 65, // Muy nuboso con lluvia
    "46": 65,
    "46n": 65, // Cubierto con lluvia
    // Chubascos
    "51": 80,
    "51n": 80,
    "52": 80,
    "52n": 80,
    "53": 81,
    "53n": 81,
    "54": 82,
    "54n": 82,
    // Tormenta
    "61": 95,
    "61n": 95,
    "62": 95,
    "62n": 95,
    "63": 96,
    "63n": 96,
    "64": 96,
    "64n": 96,
    // Nieve
    "33": 71,
    "33n": 71,
    "34": 73,
    "34n": 73,
    "35": 75,
    "35n": 75,
    "36": 75,
    "36n": 75,
    "71": 77,
    "71n": 77,
    "72": 77,
    "72n": 77,
    "73": 85,
    "73n": 85,
    "74": 86,
    "74n": 86,
  }

  return mapping[aemetCode] ?? 0
}

export const fetchWeatherForecast = async (): Promise<WeatherDay[]> => {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("forecasting_weather_history")
      .select("fecha, temp_max, temp_min, codigo_tiempo_comida, codigo_tiempo_cena")
      .gte("fecha", today)
      .order("fecha", { ascending: true })
      .limit(7)

    if (error) {
      console.error("[v0] Error fetching weather from Supabase:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn("[v0] No weather data in Supabase")
      return []
    }

    // Mapear directamente sin deduplicacion (solo AEMET)
    const forecast: WeatherDay[] = data.map((row: any) => ({
      date: row.fecha,
      maxTemp: Math.round(row.temp_max || 0),
      minTemp: Math.round(row.temp_min || 0),
      lunchCode: aemetToWmoCode(row.codigo_tiempo_comida),
      dinnerCode: aemetToWmoCode(row.codigo_tiempo_cena),
    }))

    return forecast
  } catch (error) {
    console.error("[v0] Failed to fetch weather from Supabase:", error)
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
