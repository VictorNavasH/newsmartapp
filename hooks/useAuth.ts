"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

const ALLOWED_DOMAIN = "nuasmartrestaurant.com"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)

    // Check domain restriction
    const domain = email.split("@")[1]?.toLowerCase()
    if (domain !== ALLOWED_DOMAIN) {
      setError(`Solo se permiten emails @${ALLOWED_DOMAIN}`)
      return { error: `Solo se permiten emails @${ALLOWED_DOMAIN}` }
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const msg = authError.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : authError.message
      setError(msg)
      return { error: msg }
    }

    return { data }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAuthState({ user: null, session: null, loading: false })
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error,
    signIn,
    signOut,
    setError,
  }
}
