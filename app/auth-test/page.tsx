'use client'
import { supabase } from '@/utils/supabase'
import { useState } from 'react'

export default function AuthTest() {
  const [loading, setLoading] = useState(false)

  const handleTestSignup = async () => {
    setLoading(true)
    // Detta försöker skapa en användare i ditt Supabase-projekt
    const { data, error } = await supabase.auth.signUp({
      email: 'hej@mats.se',
      password: 'testlosenord123',
    })

    if (error) {
      alert('Något gick fel: ' + error.message)
    } else {
      alert('Succé! Kopplingen fungerar. Kolla din Supabase Dashboard under Authentication > Users.')
      console.log('Användardata:', data)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Supabase Kopplingstest</h1>
      <p>Om knappen fungerar är er app och databas sammankopplade!</p>
      <button 
        onClick={handleTestSignup}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          cursor: loading ? 'not-allowed' : 'pointer', 
          backgroundColor: '#3ecf8e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px' 
        }}
      >
        {loading ? 'Skickar...' : 'Skapa ett testkonto'}
      </button>
    </div>
  )
}