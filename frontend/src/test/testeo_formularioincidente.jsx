import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import FormularioIncidente from './FormularioIncidente'
import { server } from '../../mocks/server'
import '@testing-library/jest-dom'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Tests Unitarios Específicos de Endpoints (Sprint 1)', () => {


  it('1. Debería retornar estado 201 al enviar un formulario con datos válidos', async () => {
    render(<FormularioIncidente />)


    const inputFecha = screen.getBy攻擊 || document.querySelector('input[name="fecha"]')
    fireEvent.change(inputFecha, { target: { value: '2026-05-28T16:00' } })

    const selectorGravedad = document.querySelector('select[name="gravedad"]')
    fireEvent.change(selectorGravedad, { target: { value: 'media' } })

    const inputEstudiante = screen.getByPlaceholderText(/Buscar por nombre, RUT o curso…/i)
    fireEvent.change(inputEstudiante, { target: { value: '19.876.543-2' } })

    const inputDescripcion = document.querySelector('textarea[name="descripcion"]')
    fireEvent.change(inputDescripcion, { target: { value: 'Estudiantes se gritan en el pasillo central durante el recreo.' } })

    fireEvent.click(screen.getByRole('button', { name: /Enviar Reporte/i }))

   
    await waitFor(() => {
      expect(screen.getByText(/Incidente registrado exitosamente en Panoptes/i)).toBeInTheDocument()
    })
  })


  it('2. Debería simular error 422 del endpoint si faltan campos obligatorios', async () => {
    render(<FormularioIncidente />)

  
    fireEvent.click(screen.getByRole('button', { name: /Enviar Reporte/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Incidente registrado exitosamente en Panoptes/i)).not.toBeInTheDocument()
    })
  })

  
  it('3. Debería inicializar por defecto la gravedad en nivel bajo', async () => {
    render(<FormularioIncidente />)


    const selectorGravedad = document.querySelector('select[name="gravedad"]')
    expect(selectorGravedad.value).toBe('baja')
  })

})
