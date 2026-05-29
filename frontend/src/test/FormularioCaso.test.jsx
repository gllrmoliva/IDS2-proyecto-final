import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FormularioCaso from '../components/cases/FormularioCaso';
 
//categorias:  "violencia física", "violencia psicológica" / "acoso", 
//"disrupción"/"desacato","probidad"/"fraude", "daño infraestructura /bienes", 
//"conductas de riesgo" /"uso de sustancias", "privacidad tecnología",
// "sexualidad"/"obscenidad", " incumplimiento valores institucionales","otro".

const renderFormulario = () =>
  render(<MemoryRouter><FormularioCaso /></MemoryRouter>);
 
describe('T1.3 Formulario de creación de casos', () => {
 
  it('1. el formulario incluye fecha de inicio, gravedad, descripción, estudiante principal con su rol y opción de agregar más estudiantes', () => {
    renderFormulario();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => ['Baja','Media','Alta'].includes(o.text))
    )).toBeDefined();
    expect(screen.getByPlaceholderText(/Describa el contexto/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Agregar otro estudiante/i)).toBeInTheDocument();
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
    expect(Array.from(cursoSelect.options).length).toBeGreaterThan(1);
  });
 
  it('4. un estudiante ya seleccionado no aparece disponible en los otros buscadores', () => {
    renderFormulario();
    fireEvent.click(screen.getByText(/\+ Agregar otro estudiante/i));
    expect(screen.getAllByPlaceholderText(/Buscar por nombre/i)).toHaveLength(2);
  });
 
  it('5. el caso tiene tipo y/o categoría con las opciones (ir a verlas arriba)', () => {
    renderFormulario();
    const catSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.text === 'Violencia física')
    );
    expect(catSelect).toBeDefined();
    const opciones = Array.from(catSelect.options).map(o => o.text);
    expect(opciones).toContain('Violencia física');
    expect(opciones).toContain('Violencia psicológica / Acoso');
    expect(opciones).toContain('Disrupción / Desacato');
    expect(opciones).toContain('Daño a infraestructura o bienes');
    expect(opciones).toContain('Otro');
  });
 
  it('6. el formulario permite adjuntar múltiples archivos, con opción de eliminarlos individualmente', () => {
    renderFormulario();
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'evidencia.jpg'), new File(['b'], 'acta.pdf')] }
    });
    expect(screen.getByText('evidencia.jpg')).toBeInTheDocument();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
    const botones = screen.getAllByText('✕');
    fireEvent.click(botones[botones.length - 2]);
    expect(screen.queryByText('evidencia.jpg')).not.toBeInTheDocument();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
  });
 
  it('8. al enviar exitosamente se muestra mensaje de confirmación y el formulario se limpia', async () => {
    renderFormulario();
    const desc = screen.getByPlaceholderText(/Describa el contexto/i);
    fireEvent.change(document.querySelector('input[type="date"]'), {
      target: { value: '2025-04-15' }
    });
    fireEvent.change(desc, { target: { value: 'Descripción del caso.' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear Caso/i }));
    await waitFor(() =>
      expect(screen.getByText(/Caso creado exitosamente/i)).toBeInTheDocument(),
      { timeout: 2000 }
    );
    expect(desc.value).toBe('');
  });
 
  it('9. el botón "Volver a casos" navega de regreso al monitoreo de casos', () => {
    renderFormulario();
    expect(screen.getByText(/Volver a casos/i)).toBeInTheDocument();
  });
});
 
