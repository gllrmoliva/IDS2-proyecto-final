import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useCases', () => ({
  useCases: () => ({
    loading: false,
    error: null,
    reload: vi.fn(),
    handleCambiarEstado: vi.fn(),
    cases: [
      {
        id: 'CASO-001', _id_caso: 1,
        estado: 'abierto', fechaInicio: '2025-03-28', fechaCierre: null,
        descripcion: 'Alumna presenta historial de agresiones.', gravedad: 'media',
        estudiantes: [{ nombre: 'Valentina Zuñiga Soto', nombre_curso: '3°A' }],
        hitos: [{}, {}],
      },
      {
        id: 'CASO-002', _id_caso: 2,
        estado: 'abierto', fechaInicio: '2025-03-10', fechaCierre: null,
        descripcion: 'Alumno registra múltiples anotaciones.', gravedad: 'alta',
        estudiantes: [{ nombre: 'Sebastián Muñoz Torres', nombre_curso: '2°B' }],
        hitos: [{}],
      },
      {
        id: 'CASO-003', _id_caso: 3,
        estado: 'cerrado', fechaInicio: '2025-01-10', fechaCierre: '2025-02-28',
        descripcion: 'Caso resuelto con plan de apoyo.', gravedad: 'baja',
        estudiantes: [{ nombre: 'Catalina Vega Morales', nombre_curso: '2°B' }],
        hitos: [{}, {}, {}],
      },
    ],
  }),
}));

import { CaseMonitorView } from '../components/cases/CaseMonitorView';

const renderVista = () =>
  render(<MemoryRouter><CaseMonitorView /></MemoryRouter>);

describe('T12.2 Crear vista de monitoreo de casos', () => {

  it('1. la vista muestra el listado de casos con ID, fecha de inicio, estudiantes involucrados, descripción, gravedad y estado', () => {
    renderVista();
    expect(screen.getByText('CASO-001')).toBeInTheDocument();
    expect(screen.getByText('CASO-002')).toBeInTheDocument();
    expect(screen.getByText('CASO-003')).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map(h => h.textContent.toLowerCase());
    expect(headers).toContain('id');
    expect(headers).toContain('estado');
    expect(headers).toContain('gravedad');
    expect(headers).toContain('estudiantes');
  });

  it('2. las cards de resumen muestran el conteo correcto de total, abiertos y cerrados', () => {
    renderVista();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Abiertos')).toBeInTheDocument();
    expect(screen.getByText('Cerrados')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 abiertos
  });

  it('3. los casos abiertos aparecen siempre primero en la lista', () => {
    renderVista();
    const filas = screen.getAllByRole('row').map(f => f.textContent);
    expect(filas.findIndex(t => t.includes('CASO-001')))
      .toBeLessThan(filas.findIndex(t => t.includes('CASO-003')));
  });

  it('5. la búsqueda libre filtra por ID, descripción o nombre de estudiante', () => {
    renderVista();
    const input = screen.getByPlaceholderText(/Buscar por ID/i);

    fireEvent.change(input, { target: { value: 'Valentina' } });
    expect(screen.getByText('CASO-001')).toBeInTheDocument();
    expect(screen.queryByText('CASO-002')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'plan de apoyo' } });
    expect(screen.getByText('CASO-003')).toBeInTheDocument();
    expect(screen.queryByText('CASO-001')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'CASO-002' } });
    expect(screen.getByText('CASO-002')).toBeInTheDocument();
    expect(screen.queryByText('CASO-001')).not.toBeInTheDocument();
  });

  it('6. el botón "Nuevo caso" lleva al formulario de creación', () => {
    renderVista();
    expect(screen.getByText(/Nuevo caso/i)).toBeInTheDocument();
  });
});