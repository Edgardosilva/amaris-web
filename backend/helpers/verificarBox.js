import db from '../database.js';

export const verificarBox = async (fecha, hora, horaTermino, box, concurrentSessions, procedimiento_id) => {
  try {
    const querySolapamientos = `
      SELECT box, concurrent_sessions, procedimiento_id 
      FROM horarios_ocupados 
      WHERE fecha = $1 AND (
        (hora >= $2 AND hora < $3) OR 
        ("horaTermino" > $4 AND "horaTermino" <= $5) OR 
        (hora <= $6 AND "horaTermino" >= $7)
      )
    `;

    const { rows: solapados } = await db.query(querySolapamientos, [
      fecha,
      hora,
      horaTermino,
      hora,
      horaTermino,
      hora,
      horaTermino,
    ]);

    const limpiezasFaciales = [1, 2, 3];

    if (box === "Solo en box 2") {
      const box2Ocupado = solapados.some(cita => cita.box === "Box 2");
      if (!box2Ocupado) {
        return "Box 2"; 
      } else {
        return null;
      }
    }

    if (box === "Solo en gym") {
      const gymOcupado = solapados.some(cita => cita.box === "Gym");
      if (!gymOcupado) {
        return "Gym"; 
      } else {
        return null;
      }
    }

    if (concurrentSessions === 1 && limpiezasFaciales.includes(procedimiento_id)) {
      const hayOtraLimpiezaFacial = solapados.some(cita => 
        limpiezasFaciales.includes(cita.procedimiento_id)
      );
      if (hayOtraLimpiezaFacial) {
        return null;
      }
      
      const boxesOcupados = new Set(solapados.map(cita => cita.box));
      const boxDisponible = ["Box 1", "Box 2", "Box 3"].find(b => !boxesOcupados.has(b));
      return boxDisponible || null;
    }

    if (concurrentSessions === 1) {
      const boxesOcupados = new Set(solapados.map(cita => cita.box));
      const boxDisponible = ["Box 1", "Box 2", "Box 3"].find(b => !boxesOcupados.has(b));
      return boxDisponible || null;
    }

    if (concurrentSessions > 1) {
      const boxesOcupados = new Set(solapados.map(cita => cita.box));
      const boxDisponible = ["Box 1", "Box 2", "Box 3"].find(b => !boxesOcupados.has(b));
      return boxDisponible || null;
    }

    return null; 
  } catch (error) {
    console.error("Error verificando disponibilidad de box:", error);
    throw new Error("Error al verificar la disponibilidad del box.");
  }
};
