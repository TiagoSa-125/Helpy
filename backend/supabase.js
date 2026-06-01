import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam SUPABASE_URL e SUPABASE_SERVICE_KEY no backend/.env')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
