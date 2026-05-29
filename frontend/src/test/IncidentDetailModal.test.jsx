// T8.1 — Vista de monitoreo de incidentes para coordinador
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentDetailModal } from '../components/incidents/IncidentDetailModal';

const INCIDENT_PENDIENTE = {
  id: 'INC-001',
  tipo: 'Agresión verbal',
  fecha: '2025-04-15',
  descripcion: 'Alumna insultó a compañero durante el recreo.',
  gravedad: 'baja',
  estado: 'pendiente',
  razonRechazo: null,
  reportadoPor: 'Marcela Zuñiga',
  rolReportante: 'Inspectora',
  evidencia: null,
  alumno: { nombre: 'Valentina Pereira Soto', curso: '3°A', rut: '21.345.678-9' },
  involucrados: [
    { nombre: 'Valentina Pereira Soto', rol: 'autor_agresor' },
    { nombre: 'Matías González Vera', rol: 'afectado_victima' },
  ],
};

const INCIDENT_APROBADO = { ...INCIDENT_PENDIENTE, estado: 'aprobado' };

const renderModal = (incident, overrides = {}) => {
  const props = {
    incident,
    onClose: vi.fn(),
    onAprobar: vi.fn(),
    onRechazar: vi.fn(),
    onRevertir: vi.fn(),
    ...overrides,
  };
  return { ...render(<IncidentDetailModal {...props} />), props };
};

describe('T8.1 Vista de monitoreo de incidentes para coordinador', () => {

  it('1.  al hacer clic en un incidente se abre el modal con toda la información',() => {
    renderModal(INCIDENT_PENDIENTE);
    expect(screen.getByText('INC-001')).toBeInTheDocument();
    expect(screen.getByText('Agresión verbal')).toBeInTheDocument();
    expect(screen.getByText(/Alumna insultó/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Valentina Pereira Soto/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Matías González Vera/i)).toBeInTheDocument();
    expect(screen.getByText(t => t.includes('Marcela Zuñiga'))).toBeInTheDocument();
  });

  it('2. al aprobar, el sistema obliga a escoger entre crear un caso nuevo o agregar como reincidencia a un caso ya abierto', () => {
    const { container } = renderModal(INCIDENT_PENDIENTE);
    fireEvent.click(screen.getByRole('button', { name: /Aprobar incidente/i }));
    expect(screen.getByText('Nuevo caso')).toBeInTheDocument();
    expect(container.textContent).toContain('Reincidencia');
  });

  it('3. al escoger reincidencia, solo se muestran casos activos y no se puede confirmar sin seleccionar uno', () => {
    const { container } = renderModal(INCIDENT_PENDIENTE);
    fireEvent.click(screen.getByRole('button', { name: /Aprobar incidente/i }));
    const btnReincidencia = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Reincidencia'));
    expect(btnReincidencia).toBeDefined();
    fireEvent.click(btnReincidencia);
    expect(screen.getByRole('button', { name: /Agregar como reincidencia/i })).toBeDisabled();
  });

  it('4. el coordinador puede rechazar un incidente pendiente y el sistema obliga a ingresar un motivo no permite dejarlo vacío)', () => {
    const { props } = renderModal(INCIDENT_PENDIENTE);
    fireEvent.click(screen.getByRole('button', { name: /^Rechazar$/i }));
    expect(screen.getByPlaceholderText(/Explica por qué/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Confirmar rechazo/i })[0]);
    expect(props.onRechazar).not.toHaveBeenCalled();
    expect(screen.getByText(/Debes ingresar un motivo/i)).toBeInTheDocument();
    // Con motivo válido sí se puede confirmar
    fireEvent.change(screen.getByPlaceholderText(/Explica por qué/i), {
      target: { value: 'No hay evidencia suficiente.' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Confirmar rechazo/i })[0]);
    expect(props.onRechazar).toHaveBeenCalledWith('INC-001', 'No hay evidencia suficiente.');
  });

  it('5. el coordinador puede deshacer una decisión y el sistema pide confirmación (el incidente vuelve a "pendiente")', () => {
    const { props } = renderModal(INCIDENT_APROBADO);
    fireEvent.click(screen.getByRole('button', { name: /Deshacer decisión/i }));
    expect(screen.getByText(/¿Estás segura\/o/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sí, deshacer/i }));
    expect(props.onRevertir).toHaveBeenCalledWith('INC-001');
    expect(props.onClose).toHaveBeenCalled();
  });
});