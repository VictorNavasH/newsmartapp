import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

async function checkTurnos() {
  const { data, error } = await supabase.from("turnos").select("*").order("hora_inicio", { ascending: true })

  if (error) {
    console.error("Error:", error)
    return
  }

  console.log("Tabla TURNOS:")
  console.log(JSON.stringify(data, null, 2))
}

checkTurnos()
