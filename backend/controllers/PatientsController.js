import db from '../database.js';

export const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;

    let sqlQuery = `
      SELECT 
        ca.paciente_atendido as nombre_paciente,
        COUNT(ca.id) as total_citas,
        MAX(ca.fecha) as ultima_atencion,
        (
          SELECT pd.nombre 
          FROM citas_agendadas ca2
          JOIN procedimientos_disponibles pd ON ca2.procedimiento_id = pd.id
          WHERE ca2.paciente_atendido = ca.paciente_atendido
          ORDER BY ca2.fecha DESC, ca2.hora DESC
          LIMIT 1
        ) as ultimo_procedimiento,
        (
          SELECT STRING_AGG(DISTINCT ur.email, ', ')
          FROM citas_agendadas ca3
          JOIN usuarios_registrados ur ON ca3.usuario_id = ur.id
          WHERE ca3.paciente_atendido = ca.paciente_atendido
        ) as emails_registrados,
        (
          SELECT STRING_AGG(DISTINCT ur.telefono, ', ')
          FROM citas_agendadas ca4
          JOIN usuarios_registrados ur ON ca4.usuario_id = ur.id
          WHERE ca4.paciente_atendido = ca.paciente_atendido
        ) as telefonos_registrados
      FROM citas_agendadas ca
      WHERE ca.paciente_atendido IS NOT NULL AND ca.paciente_atendido != ''
    `;

    const params = [];

    if (query && query.trim() !== '') {
      sqlQuery += ` AND ca.paciente_atendido ILIKE $1`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm);
    }

    sqlQuery += ` 
      GROUP BY ca.paciente_atendido
      ORDER BY ultima_atencion DESC
    `;

    const { rows: patients } = await db.query(sqlQuery, params);
    
    res.status(200).json({ patients });
  } catch (error) {
    console.error('❌ Error buscando pacientes:', error.message);
    res.status(500).json({ error: "Error al buscar pacientes" });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    if (!pacienteId) {
      return res.status(400).json({ error: "Nombre de paciente requerido" });
    }

    const pacienteNombre = decodeURIComponent(pacienteId);

    const historyQuery = `
      SELECT
        ca.id,
        ca.fecha,
        ca.hora,
        ca."horaTermino",
        ca.duracion,
        ca.box,
        ca.estado,
        ca.paciente_atendido,
        pd.nombre AS procedimiento,
        ur.nombre as nombre_solicitante,
        ur.apellido as apellido_solicitante,
        ur.email as email_solicitante,
        ur.telefono as telefono_solicitante
      FROM citas_agendadas ca
      JOIN procedimientos_disponibles pd ON ca.procedimiento_id = pd.id
      JOIN usuarios_registrados ur ON ca.usuario_id = ur.id
      WHERE ca.paciente_atendido = $1
      ORDER BY ca.fecha DESC, ca.hora DESC
    `;
    const { rows: history } = await db.query(historyQuery, [pacienteNombre]);

    if (history.length === 0) {
      return res.status(404).json({ error: "No se encontró historial para este paciente" });
    }

    const stats = {
      total_citas: history.length,
      procedimientos_realizados: [...new Set(history.map(h => h.procedimiento))].length,
      ultima_visita: history.length > 0 ? history[0].fecha : null
    };

    const solicitantes = [...new Set(history.map(h => ({
      nombre: `${h.nombre_solicitante} ${h.apellido_solicitante}`,
      email: h.email_solicitante,
      telefono: h.telefono_solicitante
    })).map(s => JSON.stringify(s)))].map(s => JSON.parse(s));

    const patientData = {
      nombre: pacienteNombre,
      solicitantes: solicitantes
    };

    res.status(200).json({ 
      patient: patientData, 
      history,
      stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.message);
    res.status(500).json({ error: "Error al obtener historial del paciente" });
  }
};

export default {
  searchPatients,
  getPatientHistory
};
