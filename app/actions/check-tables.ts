"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function checkTables() {
  try {
    // Obtener lista de tablas
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tablesError) {
      console.error("Error getting tables:", tablesError)
      return { success: false, error: tablesError.message }
    }

    const tableNames = tables?.map((t) => t.table_name) || []
    console.log("Available tables:", tableNames)

    // Buscar tabla log_dotyk_eventos específicamente
    const logTable = tableNames.find(
      (name) => name.includes("log") && name.includes("dotyk") && name.includes("eventos"),
    )

    if (logTable) {
      // Obtener estructura de la tabla
      const { data: sampleData, error: sampleError } = await supabase.from(logTable).select("*").limit(1)

      const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []

      return {
        success: true,
        tables: tableNames,
        logTable: logTable,
        logTableColumns: columns,
        sampleData: sampleData?.[0] || null,
      }
    }

    return {
      success: true,
      tables: tableNames,
      logTable: null,
      message: "No se encontró tabla log_dotyk_eventos",
    }
  } catch (error: any) {
    console.error("Error:", error)
    return { success: false, error: error.message }
  }
}
