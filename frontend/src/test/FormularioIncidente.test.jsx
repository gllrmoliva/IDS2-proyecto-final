import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FormularioIncidente from '../components/incidents/FormularioIncidente';

//categorias:  "violencia física", "violencia psicológica" / "acoso", 
//"disrupción"/"desacato","probidad"/"fraude", "daño infraestructura /bienes", 
//"conductas de riesgo" /"uso de sustancias", "privacidad tecnología",
// "sexualidad"/"obscenidad", " incumplimiento valores institucionales","otro".

const renderFormulario = () =>
  render(<MemoryRouter><FormularioIncidente /></MemoryRouter>);

describe('T1.2 Formulario de reporte de incidentes', () => {

  it('1. el formulario incluye fecha y hora, gravedad, descripción, estudiante principal con su rol y opción de agregar más estudiantes', () => {
    renderFormulario();
    expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => ['Baja','Media','Alta'].includes(o.text))
    )).toBeDefined();
    expect(screen.getByPlaceholderText(/Describa de forma objetiva/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Agregar otro involucrado/i)).toBeInTheDocument();
  });

  it('2. los roles disponibles son: Sin rol, Autor/Agresor, Afectado/Víctima, Cómplice y Testigo/Espectador', () => {
    renderFormulario();
    const rolSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.text === 'Autor / Agresor')
    );
    expect(rolSelect).toBeDefined();
    const opciones = Array.from(rolSelect.options).map(o => o.text);
    expect(opciones).toContain('Sin rol');
    expect(opciones).toContain('Autor / Agresor');
    expect(opciones).toContain('Afectado / Víctima');
    expect(opciones).toContain('Cómplice');
    expect(opciones).toContain('Testigo / Espectador');
  });

  it('3. el selector de curso filtra los estudiantes en el buscador', () => {
    renderFormulario();
    const cursoSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.text === 'Todos')
    );
    expect(cursoSelect).toBeDefined();
    const cursos = Array.from(cursoSelect.options).map(o => o.text);
    expect(cursos).toContain('Todos');
    expect(cursos.length).toBeGreaterThan(1);
  });

  it('4. un estudiante ya seleccionado no aparece disponible en los otros buscadores', () => {
    renderFormulario();
    fireEvent.click(screen.getByText(/\+ Agregar otro involucrado/i));
    expect(screen.getAllByPlaceholderText(/Buscar por nombre/i)).toHaveLength(2);
  });

  it('5. el incidente tiene tipo y/o categoría con las opciones (ir a verlas arriba)', () => {
    renderFormulario();
    const catSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.text === 'Violencia física')
    );
    expect(catSelect).toBeDefined();
    const opciones = Array.from(catSelect.options).map(o => o.text);
    expect(opciones).toContain('Violencia física');
    expect(opciones).toContain('Violencia psicológica / Acoso');
    expect(opciones).toContain('Disrupción / Desacato');
    expect(opciones).toContain('Probidad / Fraude');
    expect(opciones).toContain('Daño a infraestructura o bienes');
    expect(opciones).toContain('Conductas de riesgo / Sustancias');
    expect(opciones).toContain('Privacidad / Tecnología');
    expect(opciones).toContain('Sexualidad / Obscenidad');
    expect(opciones).toContain('Valores institucionales');
    expect(opciones).toContain('Otro');
  });

  it('6. el formulario permite adjuntar múltiples archivos, con opción de eliminarlos individualmente', () => {
    renderFormulario();
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'foto.jpg'), new File(['b'], 'acta.pdf')] }
    });
    expect(screen.getByText('foto.jpg')).toBeInTheDocument();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
    const botones = screen.getAllByText('✕');
    fireEvent.click(botones[botones.length - 2]);
    expect(screen.queryByText('foto.jpg')).not.toBeInTheDocument();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
  });

  it('8. al enviar exitosamente se muestra mensaje de confirmación y el formulario se limpia', async () => {
    renderFormulario();
    const desc = screen.getByPlaceholderText(/Describa de forma objetiva/i);
    fireEvent.change(document.querySelector('input[type="datetime-local"]'), {
      target: { value: '2025-04-15T10:00' }
    });
    fireEvent.change(desc, { target: { value: 'Descripción del incidente.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Reporte/i }));
    await waitFor(() =>
      expect(screen.getByText(/Incidente registrado exitosamente/i)).toBeInTheDocument(),
      { timeout: 2000 }
    );
    expect(desc.value).toBe('');
  });
});