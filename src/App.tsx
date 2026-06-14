import './index.css'
import { supabase } from './lib/supabase'

console.log('Supabase client:', supabase)

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-sm text-gray-500 tracking-widest uppercase mb-2">ThisUncle Technologies</p>
        <h1 className="text-2xl font-semibold text-gray-900">Client Dashboard</h1>
        <p className="mt-2 text-gray-400 text-sm">Setting up...</p>
      </div>
    </div>
  )
}

export default App
