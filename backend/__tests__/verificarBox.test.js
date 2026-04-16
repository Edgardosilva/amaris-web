/**
 * Tests para verificarBox.js
 * 
 * Este archivo testea la lógica crítica de asignación de boxes para procedimientos.
 * 
 * REGLAS DE NEGOCIO:
 * ==================
 * 
 * 1. ENTRENAMIENTO FUNCIONAL (ID: 6)
 *    - Solo puede realizarse en "Gym"
 *    - Si Gym está ocupado, se rechaza la cita
 * 
 * 2. RADIOFRECUENCIA (ID: 10)
 *    - Solo puede realizarse en "Box 2"
 *    - Si Box 2 está ocupado, se rechaza la cita
 * 
 * 3. LIMPIEZAS FACIALES (IDs: 1, 2, 3)
 *    - Solo puede haber 1 limpieza facial a la vez
 *    - Puede coexistir con otros procedimientos en diferentes boxes
 * 
 * 4. CAPACIDAD DE BOXES
 *    - Máximo 3 boxes ocupados simultáneamente (Box 1, Box 2, Box 3)
 *    - Si los 3 están ocupados, se rechaza cualquier procedimiento nuevo
 * 
 * 5. PROCEDIMIENTOS COMPARTIBLES (concurrent_sessions > 1)
 *    - Pueden agendarse en cualquier box disponible
 *    - Ejemplos: Masajes (cs=3), Depilación (cs=3)
 * 
 * CÓMO FUNCIONA:
 * ==============
 * - verificarBox() consulta la BD para ver qué boxes están ocupados
 * - Aplica las reglas de negocio según el tipo de procedimiento
 * - Retorna el box asignado (ej: "Box 1", "Gym") o null si no hay disponibilidad
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

// Mockear el módulo de database antes de importar verificarBox
jest.unstable_mockModule('../database.js', () => ({
  default: {
    query: mockQuery,
    execute: mockQuery,
  }
}));

// Importar después de mockear
const { verificarBox } = await import('../helpers/verificarBox.js');
const mockDb = (await import('../database.js')).default;

describe('verificarBox - Asignación de Boxes', () => {
  
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  // ============================================================================
  // REGLA 1: ENTRENAMIENTO FUNCIONAL
  // ============================================================================
  
  describe('Entrenamiento Funcional (ID: 6) - Solo Gym', () => {
    
    test('Debe asignar "Gym" cuando está disponible', async () => {
      // DADO: No hay citas en el horario solicitado
      mockDb.execute.mockResolvedValue({ rows: [] });

      // CUANDO: Se intenta agendar Entrenamiento Funcional
      const resultado = await verificarBox(
        '2025-12-05',      // fecha
        '10:00:00',        // hora inicio
        '11:00:00',        // hora término
        'Solo en gym',     // restricción del procedimiento
        1,                 // concurrent_sessions
        6                  // procedimiento_id (Entrenamiento Funcional)
      );

      // ENTONCES: Debe asignar "Gym"
      expect(resultado).toBe('Gym');
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    test('Debe retornar null cuando Gym está ocupado', async () => {
      // DADO: Gym ya está ocupado en ese horario
      mockDb.execute.mockResolvedValue({ rows: [
        { 
          box: 'Gym', 
          concurrent_sessions: 1, 
          procedimiento_id: 6 // Otro entrenamiento
        }
      ] });

      // CUANDO: Se intenta agendar Entrenamiento Funcional
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '11:00:00',
        'Solo en gym',
        1,
        6
      );

      // ENTONCES: Debe rechazar (retornar null)
      expect(resultado).toBeNull();
    });
  });

  // ============================================================================
  // REGLA 2: RADIOFRECUENCIA
  // ============================================================================

  describe('Radiofrecuencia (ID: 10) - Solo Box 2', () => {
    
    test('Debe asignar "Box 2" cuando está disponible', async () => {
      // DADO: No hay citas en el horario
      mockDb.execute.mockResolvedValue({ rows: [] });

      // CUANDO: Se intenta agendar Radiofrecuencia
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Solo en box 2',   // restricción del procedimiento
        1,
        10                 // procedimiento_id (Radiofrecuencia)
      );

      // ENTONCES: Debe asignar "Box 2"
      expect(resultado).toBe('Box 2');
    });

    test('Debe retornar null cuando Box 2 está ocupado', async () => {
      // DADO: Box 2 ya está ocupado
      mockDb.execute.mockResolvedValue({ rows: [
        { 
          box: 'Box 2', 
          concurrent_sessions: 1, 
          procedimiento_id: 10 
        }
      ] });

      // CUANDO: Se intenta agendar Radiofrecuencia
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Solo en box 2',
        1,
        10
      );

      // ENTONCES: Debe rechazar
      expect(resultado).toBeNull();
    });
  });

  // ============================================================================
  // REGLA 3: LIMPIEZAS FACIALES
  // ============================================================================

  describe('Limpiezas Faciales (IDs: 1, 2, 3) - Solo 1 a la vez', () => {
    
    test('Debe asignar box cuando NO hay otra limpieza facial', async () => {
      // DADO: No hay limpiezas faciales en ese horario
      mockDb.execute.mockResolvedValue({ rows: [
        { 
          box: 'Box 1', 
          concurrent_sessions: 3, 
          procedimiento_id: 5 // Masaje (no es limpieza)
        }
      ] });

      // CUANDO: Se intenta agendar una Limpieza Facial
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '11:30:00',
        'Cualquier box',
        1,
        2                  // procedimiento_id (Limpieza Profunda)
      );

      // ENTONCES: Debe asignar un box disponible
      expect(resultado).toBeTruthy(); // No null
      expect(['Box 2', 'Box 3']).toContain(resultado); // Box 2 o 3
    });

    test('Debe rechazar si YA hay otra limpieza facial', async () => {
      // DADO: Ya hay una limpieza facial (ID: 1) en ese horario
      mockDb.execute.mockResolvedValue({ rows: [
        { 
          box: 'Box 1', 
          concurrent_sessions: 1, 
          procedimiento_id: 1 // Limpieza Facial Básica
        }
      ] });

      // CUANDO: Se intenta agendar otra limpieza facial (ID: 2)
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '11:30:00',
        'Cualquier box',
        1,
        2                  // Limpieza Profunda
      );

      // ENTONCES: Debe rechazar (no puede haber 2 limpiezas a la vez)
      expect(resultado).toBeNull();
    });

    test('Limpieza facial puede coexistir con otros procedimientos', async () => {
      // DADO: Hay una limpieza facial en Box 1
      mockDb.execute.mockResolvedValue({ rows: [
        { 
          box: 'Box 1', 
          concurrent_sessions: 1, 
          procedimiento_id: 1 // Limpieza Facial
        }
      ] });

      // CUANDO: Se intenta agendar un Masaje (no es limpieza)
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Cualquier box',
        3,                 // concurrent_sessions > 1 (compartible)
        5                  // Masaje
      );

      // ENTONCES: Debe asignar Box 2 o Box 3 (puede coexistir)
      expect(resultado).toBeTruthy();
      expect(['Box 2', 'Box 3']).toContain(resultado);
    });
  });

  // ============================================================================
  // REGLA 4: CAPACIDAD DE BOXES
  // ============================================================================

  describe('Capacidad de Boxes - Máximo 3 boxes', () => {
    
    test('Debe asignar box cuando hay capacidad disponible', async () => {
      // DADO: Solo 2 boxes ocupados
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 3, procedimiento_id: 5 },
        { box: 'Box 2', concurrent_sessions: 3, procedimiento_id: 7 }
      ] });

      // CUANDO: Se intenta agendar un nuevo procedimiento
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Cualquier box',
        3,
        5                  // Masaje
      );

      // ENTONCES: Debe asignar Box 3 (el único disponible)
      expect(resultado).toBe('Box 3');
    });

    test('Debe rechazar cuando los 3 boxes están ocupados', async () => {
      // DADO: Los 3 boxes están ocupados
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 3, procedimiento_id: 5 },
        { box: 'Box 2', concurrent_sessions: 3, procedimiento_id: 7 },
        { box: 'Box 3', concurrent_sessions: 1, procedimiento_id: 8 }
      ] });

      // CUANDO: Se intenta agendar un nuevo procedimiento
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Cualquier box',
        3,
        5
      );

      // ENTONCES: Debe rechazar (no hay boxes disponibles)
      expect(resultado).toBeNull();
    });
  });

  // ============================================================================
  // REGLA 5: PROCEDIMIENTOS COMPARTIBLES
  // ============================================================================

  describe('Procedimientos Compartibles (cs > 1)', () => {
    
    test('Debe asignar cualquier box disponible para masajes', async () => {
      // DADO: Box 1 ocupado
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 3, procedimiento_id: 5 }
      ] });

      // CUANDO: Se intenta agendar un Masaje (cs=3, compartible)
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '10:45:00',
        'Cualquier box',
        3,                 // cs > 1 = compartible
        5                  // Masaje
      );

      // ENTONCES: Debe asignar Box 2 o Box 3
      expect(['Box 2', 'Box 3']).toContain(resultado);
    });
  });

  // ============================================================================
  // ESCENARIOS COMPLEJOS
  // ============================================================================

  describe('Escenarios Complejos - Múltiples procedimientos', () => {
    
    test('Debe permitir 4 procedimientos simultáneos en diferentes espacios', async () => {
      // ESCENARIO:
      // - 1 Limpieza Facial en Box 1
      // - 1 Masaje en Box 2
      // - 1 Presoterapia en Box 3
      // - Intentando agendar: 1 Entrenamiento en Gym
      
      // DADO: Los 3 boxes ocupados, pero Gym libre
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 1, procedimiento_id: 1 }, // Limpieza
        { box: 'Box 2', concurrent_sessions: 3, procedimiento_id: 5 }, // Masaje
        { box: 'Box 3', concurrent_sessions: 1, procedimiento_id: 8 }  // Presoterapia
      ] });

      // CUANDO: Se intenta agendar Entrenamiento
      const resultado = await verificarBox(
        '2025-12-05',
        '10:00:00',
        '11:00:00',
        'Solo en gym',
        1,
        6                  // Entrenamiento Funcional
      );

      // ENTONCES: Debe asignar Gym (Gym es independiente de los boxes)
      expect(resultado).toBe('Gym');
    });
  });

  // ============================================================================
  // VALIDACIÓN DE SOLAPAMIENTO DE HORARIOS
  // ============================================================================

  describe('Solapamiento de Horarios', () => {
    
    test('Debe detectar conflicto cuando horario solapa al inicio', async () => {
      // DADO: Box 1 ocupado de 10:00 a 11:30
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 1, procedimiento_id: 2 }
      ] });

      // CUANDO: Se intenta agendar de 10:15 a 11:45 (solapa con Box 1)
      const resultado = await verificarBox(
        '2025-12-05',
        '10:15:00',        // Inicia durante otra cita
        '11:45:00',
        'Cualquier box',
        3,
        5                  // Masaje
      );

      // ENTONCES: Debe asignar Box 2 (detectó conflicto en Box 1)
      expect(resultado).toBe('Box 2');
    });

    test('Debe detectar conflicto cuando horario solapa al final', async () => {
      // DADO: Box 1 ocupado de 10:00 a 11:30
      mockDb.execute.mockResolvedValue({ rows: [
        { box: 'Box 1', concurrent_sessions: 3, procedimiento_id: 5 }
      ] });

      // CUANDO: Se intenta agendar de 09:30 a 10:30 (termina durante otra cita)
      const resultado = await verificarBox(
        '2025-12-05',
        '09:30:00',
        '10:30:00',        // Termina durante otra cita
        'Cualquier box',
        3,
        5
      );

      // ENTONCES: Debe asignar Box 2 (detectó conflicto en Box 1)
      expect(resultado).toBe('Box 2');
    });
  });
});
