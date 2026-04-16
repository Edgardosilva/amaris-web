import { verificarDisponibilidad } from '../helpers/verificarDisponibilidad.js';
import { verificarBox } from '../helpers/verificarBox.js';
import db from '../database.js';
import jwt from 'jsonwebtoken';


// Controlador para obtener todas las citas
export const getAllAppointments = async (req, res) => {
  try {
    console.log('🔍 [ADMIN] Obteniendo todas las citas...');
    
    const query = `
      SELECT
        ca.id,
        ca.fecha,
        ca.hora,
        ca."horaTermino",
        ca.duracion,
        ca.box,
        ca.estado,
        ca.paciente_atendido,
        pd.nombre AS nombre_procedimiento,
        ur.nombre AS solicitante
      FROM citas_agendadas ca
      JOIN procedimientos_disponibles pd ON ca.procedimiento_id = pd.id
      JOIN usuarios_registrados ur ON ca.usuario_id = ur.id
      ORDER BY ca.fecha DESC, ca.hora DESC;
    `;
    
    const { rows: appointments } = await db.query(query);
    
    console.log(`✅ [ADMIN] ${appointments.length} citas encontradas`);
    res.status(200).json({ appointments });
    
  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo citas:', error.message);
    res.status(500).json({ error: "Error al obtener citas" });
  }
};



export const getAvailableAppointments = async (req, res) => {
  try {
    const { selectedDate, procedimiento_id } = req.query;

    if (!selectedDate || selectedDate.trim() === "") {
      return res.status(400).json({ error: "Date is required." });
    }

    if (!procedimiento_id) {
      return res.status(400).json({ error: "Procedimiento ID is required." });
    }

    const isValidDate = !isNaN(Date.parse(selectedDate));
    if (!isValidDate) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    // Consulta horarios ocupados con procedimiento_id
    const query = `
      SELECT hora, "horaTermino", box, procedimiento_id FROM horarios_ocupados
      WHERE fecha = $1
    `;
    const { rows: occupiedSchedules } = await db.query(query, [selectedDate]);
    const allTimes = generateTimeSlots("09:00", "18:00", 15); 
    
    const availableTimes = allTimes.filter((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      // Obtener todas las citas que se solapan con este horario
      const citasEnHorario = occupiedSchedules.filter(schedule => {
        const [startHours, startMinutes] = schedule.hora.split(":").map(Number);
        const [endHours, endMinutes] = schedule.horaTermino.split(":").map(Number);
        const startInMinutes = startHours * 60 + startMinutes;
        const endInMinutes = endHours * 60 + endMinutes;
        
        // Verificar si hay solapamiento: el horario actual está dentro del rango ocupado
        return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
      });
      
      // Si no hay citas en este horario, está disponible
      if (citasEnHorario.length === 0) return true;
      
      const limpiezasFaciales = [1, 2, 3];
      const procId = parseInt(procedimiento_id);
      
      // Si el procedimiento que se quiere agendar es limpieza facial
      if (limpiezasFaciales.includes(procId)) {
        // Verificar si ya hay otra limpieza facial
        const hayLimpiezaFacial = citasEnHorario.some(cita => 
          limpiezasFaciales.includes(cita.procedimiento_id)
        );
        if (hayLimpiezaFacial) return false; // No se puede agendar
        
        // Verificar si hay boxes disponibles
        const boxesOcupados = new Set(
          citasEnHorario
            .filter(cita => ["Box 1", "Box 2", "Box 3"].includes(cita.box))
            .map(cita => cita.box)
        );
        return boxesOcupados.size < 3;
      }
      
      // Si el procedimiento requiere el Gym
      if (procId === 6) { // Entrenamiento Funcional
        const gymOcupado = citasEnHorario.some(cita => cita.box === "Gym");
        return !gymOcupado;
      }
      
      // Si el procedimiento requiere Box 2
      if (procId === 10) { // Radiofrecuencia Facial
        const box2Ocupado = citasEnHorario.some(cita => cita.box === "Box 2");
        return !box2Ocupado;
      }
      
      // Para otros procedimientos, verificar si hay boxes disponibles
      // Contar boxes ocupados (solo Box 1, 2, 3)
      const boxesOcupados = new Set(
        citasEnHorario
          .filter(cita => ["Box 1", "Box 2", "Box 3"].includes(cita.box))
          .map(cita => cita.box)
      );
      
      // Si hay menos de 3 boxes ocupados, está disponible
      return boxesOcupados.size < 3;
    });

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Generar intervalos de tiempo
const generateTimeSlots = (start, end, interval) => {
  const times = [];
  let current = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  while (current <= endTime) {
    times.push(current.toTimeString().slice(0, 5)); 
    current.setMinutes(current.getMinutes() + interval);
  }

  return times;
};



// Controlador para crear una nueva cita
export const createAppointment = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: 'Token no encontrado. Inicia sesión.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;

    const {
      duracion,
      fecha,
      hora,
      horaTermino,
      paciente_atendido,
      procedimiento_id,
      box,
      concurrentSessions,
      estado
    } = req.body;

    if (!fecha || !hora || !horaTermino || !procedimiento_id || !box || !concurrentSessions) {
      return res.status(400).json({ error: "Faltan datos obligatorios en la solicitud" });
    }

    const boxAsignado = await verificarBox(fecha, hora, horaTermino, box, concurrentSessions, procedimiento_id);
    
    if (!boxAsignado) {
      return res.status(400).json({ error: "No hay un box disponible para este horario." });
    }

    // Insertar en horarios_ocupados
    const queryInsert = `
      INSERT INTO horarios_ocupados (fecha, hora, "horaTermino", procedimiento_id, box, concurrent_sessions)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(queryInsert, [
      fecha, hora, horaTermino, procedimiento_id, boxAsignado, concurrentSessions
    ]);

    // Insertar en citas_agendadas con estado "Confirmada" por defecto
    const queryInsertCitas = `
      INSERT INTO citas_agendadas 
      (usuario_id, procedimiento_id, duracion, box, estado, fecha, hora, "horaTermino", paciente_atendido)
      VALUES ($1, $2, $3, $4, 'Confirmada', $5, $6, $7, $8)
    `;
    await db.query(queryInsertCitas, [
      usuarioId,
      procedimiento_id,
      duracion,
      boxAsignado,
      fecha,
      hora,
      horaTermino,
      paciente_atendido
    ]);

    res.status(201).json({ 
      message: "Cita creada y confirmada exitosamente", 
      box: boxAsignado,
      estado: "Confirmada"
    });

  } catch (error) {
    console.error("Error al crear la cita:", error.message);
    res.status(500).json({ error: "Error al crear la cita" });
  }
};


export const getUserAppointments = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: 'Token no encontrado. Inicia sesión.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario_id = decoded.id;
    const query = `
        SELECT
          ca.id,
          ca.fecha,
          ca.hora,
          ca."horaTermino",
          ca.duracion,
          ca.box,
          ca.estado,
          ca.paciente_atendido,
          pd.nombre AS nombre_procedimiento,
          ur.nombre AS solicitante
        FROM citas_agendadas ca
        JOIN procedimientos_disponibles pd ON ca.procedimiento_id = pd.id
        JOIN usuarios_registrados ur ON ca.usuario_id = ur.id
        WHERE ca.usuario_id = $1
        ORDER BY ca.fecha DESC, ca.hora DESC
    `;
    const { rows: appointments } = await db.query(query, [usuario_id]);
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error al obtener citas:', error.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID de cita requerido' });
    }

    const { rows: result } = await db.query('SELECT * FROM citas_agendadas WHERE id = $1', [id]);

    if (!result.length) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const cita = result[0];

    const citaDate = new Date(cita.fecha);
    const now = new Date();
    const diffInMs = citaDate - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return res.status(400).json({ message: 'No se puede eliminar una cita con menos de 24 horas de anticipación.' });
    }

    await db.query('DELETE FROM citas_agendadas WHERE id = $1', [id]);

    return res.status(200).json({ message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error("Error al eliminar la cita:", error.message);
    res.status(500).json({ message: 'Hubo un error al eliminar la cita.' });
  }
};







  

// Controlador para actualizar una cita por ID
// export const updateAppointment = (req, res) => {
//     const { id } = req.params;
//     const { date, time, box } = req.body;

//     const appointment = appointments.horaFind(a => a.id === parseInt(id));
//     if (appointment) {
//         appointment.date = date || appointment.date;
//         appointment.time = time || appointment.time;
//         appointment.box = box || appointment.box;

//         res.json(appointment);
//     } else {
//         res.status(404).json({ message: "Cita no encontrada" });
//     }
// };

// Controlador para eliminar una cita por ID
// export const deleteAppointment = (req, res) => {
//     const { id } = req.params;
//     const index = appointments.horaFindIndex(a => a.id === parseInt(id));
//     if (index !== -1) {
//         appointments.splice(index, 1);
//         res.status(204).end();
//     } else {
//         res.status(404).json({ message: "Cita no encontrada" });
//     }
// };

export default {
    getAllAppointments,
    getAvailableAppointments,
    createAppointment,
    getUserAppointments,
    deleteAppointment
};
