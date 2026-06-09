import { render, screen } from '@testing-library/react'
import React from 'react'
import PerfilEstudiante from './PerfilEstudiante'
import '@testing-library/jest-dom'

describe('Tests Unitarios - T9.2 Hoja de Vida del Estudiante', () => {

  // TEST 1: VERIFICAR RENDERIZADO E IDENTIDAD
  it('1. Debería desplegar correctamente el nombre e información clave del estudiante', () => {
    render(<PerfilEstudiante />)
    
    const nombreEstudiante = screen.getByTestId('student-name')
    expect(nombreEstudiante).toBeInTheDocument()
    expect(nombreEstudiante.textContent).toBe('Juan Pablo Dudas')
    expect(screen.getByText(/RUT: 19.876.543-2/i)).toBeInTheDocument()
  })

  // TEST 2: CONSISTENCIA DE INDICADORES ACADÉMICOS
  it('2. Debería renderizar los paneles de Promedio y Asistencia', () => {
    render(<PerfilEstudiante />)
    
    expect(screen.getByText('Promedio General')).toBeInTheDocument()
    expect(screen.getByText('Asistencia Anual')).toBeInTheDocument()
    expect(screen.getByText('5.8')).toBeInTheDocument()
  })

  // TEST 3: CARGA CORRECTA DEL HISTORIAL DE INCIDENTES
  it('3. Debería listar las anotaciones previas cargadas en la hoja de vida', () => {
    render(<PerfilEstudiante />)
    
    // Validamos que se listen los textos del historial simulado
    expect(screen.getByText(/Atraso reiterado al ingreso del primer bloque/i)).toBeInTheDocument()
    expect(screen.getByText(/Gravedad media/i)).toBeInTheDocument()
  })

})
