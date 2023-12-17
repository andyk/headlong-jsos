import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ["fsevents"] },
  define: {
    'import.meta.env.SUPABASE_URL_JSOS': JSON.stringify(process.env.SUPABASE_URL_JSOS),
    'import.meta.env.SUPABASE_SERVICE_ROLE_KEY_JSOS': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY_JSOS),
    'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
    'VITE_VERCEL_ENV': JSON.stringify(process.env.VITE_VERCEL_ENV)
  }
})
