import { ZodError } from 'zod';

/**
 * Middleware para validar datos con esquemas de Zod
 * @param {ZodSchema} schema - El esquema de Zod a usar para validar
 * @returns {Function} Middleware de Express
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validar y sanitizar el body de la petición
      const validatedData = schema.parse(req.body);
      
      // Reemplazar req.body con los datos validados y sanitizados
      req.body = validatedData;
      
      next();
    } catch (error) {
      // Manejar errores de validación de Zod
      if (error instanceof ZodError) {
        // Formatear errores para una respuesta clara
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: "Error de validación",
          details: errors,
          message: errors[0].message // Primer error para compatibilidad
        });
      }
      
      // Otros errores inesperados
      return res.status(500).json({
        error: "Error interno del servidor"
      });
    }
  };
};
