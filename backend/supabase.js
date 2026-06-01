import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
