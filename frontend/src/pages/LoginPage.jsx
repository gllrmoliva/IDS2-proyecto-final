// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!response.ok) throw new Error('Credenciales inválidas. Por favor, intente nuevamente.');

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      navigate('/incidents', { replace: true });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f1f5f9', // Coincide con tu bg-slate-100
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        {/* Logo / Título */}
        <div style={{
          width: '48px',
          height: '48px',
          background: '#1e3a7a',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '24px' }}>P</span>
        </div>
        
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '24px' }}>
          Bienvenido a Panoptes
        </h2>
        <p style={{ margin: '0 0 2rem 0', color: '#64748b', fontSize: '14px' }}>
          Ingresa tus credenciales para continuar
        </p>

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#ef4444', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            fontSize: '14px',
            width: '100%',
            marginBottom: '1.5rem',
            border: '1px solid #f87171'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
              Correo Institucional
            </label>
            <input 
              type="email" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="nombre@colegio.cl"
              style={{ 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: '0.5rem',
              padding: '0.875rem', 
              borderRadius: '8px',
              border: 'none',
              background: isLoading ? '#94a3b8' : '#1e3a7a',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
