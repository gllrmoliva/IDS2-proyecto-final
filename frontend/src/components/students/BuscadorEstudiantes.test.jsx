import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import BuscadorEstudiantes from './BuscadorEstudiantes'
import '@testing-library/jest-dom'

describe('Tests Unitarios - T9.3 Buscador de Estudiantes', () => {

  // TEST 1: RENDERIZADO INICIAL COMPLETO
  it('1. Debería mostrar la interfaz de búsqueda y listar todos los estudiantes inicialmente', () => {
    render(<BuscadorEstudiantes />)
    
    expect(screen.getByText('Buscador Global de Estudiantes')).toBeInTheDocument()
    expect(screen.getByText('Juan Pablo Dudas')).toBeInTheDocument()
    expect(screen.getByText('María Jesús Ignacia')).toBeInTheDocument()
  })

  // TEST 2: FILTRADO DINÁMICO POR TEXTO (NOMBRE O RUT)
  it('2. Debería filtrar la lista al ingresar un término en la barra de búsqueda', () => {
    render(<BuscadorEstudiantes />)
    
    const input = screen.getByTestId('input-busqueda')
    
    // Simulo que busco por el apellido "Almonte"
    fireEvent.change(input, { target: { value: 'Almonte' } })
    
    expect(screen.getByText('Pedro Almonte Fuenzalida')).toBeInTheDocument()
    expect(screen.queryByText('Juan Pablo Dudas')).not.toBeInTheDocument()
  })

  // TEST 3: FILTRADO SEGURO POR SELECTOR DE CURSOS
  it('3. Debería reducir los resultados al cambiar el selector de curso', () => {
    render(<BuscadorEstudiantes />)
    
    const select = screen.getByTestId('select-curso')
    
    // Simulo que selecciono el curso "4° Medio A"
    fireEvent.change(select, { target: { value: '4° Medio A' } })
    
    expect(screen.getByText('María Jesús Ignacia')).toBeInTheDocument()
    expect(screen.queryByText('Juan Pablo Dudas')).not.toBeInTheDocument()
  })

})
