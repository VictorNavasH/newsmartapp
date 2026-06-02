"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchHermesStatus,
  fetchHermesMemory,
  fetchHermesSessions,
  fetchHermesCronJobs,
  fetchHermesSkills,
  fetchHermesAnalytics,
} from "@/lib/hermesService"

// El VPS sincroniza cada ~5 min; refrescamos el estado cada 60s para que el
// badge online/offline y los recursos se mantengan al día.

export function useHermesStatus() {
  return useQuery({
    queryKey: ["hermesStatus"],
    queryFn: fetchHermesStatus,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}

export function useHermesMemory() {
  return useQuery({
    queryKey: ["hermesMemory"],
    queryFn: fetchHermesMemory,
    staleTime: 5 * 60 * 1000,
  })
}

export function useHermesSessions(limit = 50) {
  return useQuery({
    queryKey: ["hermesSessions", limit],
    queryFn: () => fetchHermesSessions(limit),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  })
}

export function useHermesCronJobs() {
  return useQuery({
    queryKey: ["hermesCronJobs"],
    queryFn: fetchHermesCronJobs,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  })
}

export function useHermesSkills() {
  return useQuery({
    queryKey: ["hermesSkills"],
    queryFn: fetchHermesSkills,
    staleTime: 10 * 60 * 1000,
  })
}

export function useHermesAnalytics(days = 30) {
  return useQuery({
    queryKey: ["hermesAnalytics", days],
    queryFn: () => fetchHermesAnalytics(days),
    staleTime: 10 * 60 * 1000,
  })
}
