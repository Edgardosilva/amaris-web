import db from '../database.js';

export const verificarDisponibilidad = async (fecha, hora, horaTermino, box, concurrentSessions) => {
  try {

    if (!concurrentSessions) {
    console.error("ConcurrentSessions no recibido correctamente.");
    return false;
    }
    
    const querySolapamientos = `
        SELECT box, concurrent_sessions 
        FROM horarios_ocupados 
        WHERE fecha = ? AND hora BETWEEN ? AND ?
      `;

    const [solapados] = await db.execute(querySolapamientos, [fecha, hora, horaTermino]);

 
    if (concurrentSessions === 1) {
      const hayConflicto = solapados.some(cita => cita.concurrent_sessions === 1);
      if (hayConflicto) {
        return null; 
      }
    }
  
    if (concurrentSessions === 3) {
      const sesionesEnMismoBox = solapados.filter(cita => cita.box === box);
      const sesionesEnMismoBoxActuales = sesionesEnMismoBox.reduce(
        (total, registro) => total + registro.concurrent_sessions,
        0
      );

      if (sesionesEnMismoBoxActuales + concurrentSessions > 3) {
        return null;
      }
    }
    
    return true; 
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    throw new Error("Error al verificar disponibilidad.");
  }
};
