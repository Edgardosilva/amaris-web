import { z } from "zod";

/**
 * Esquema de validación para el login
 * Valida y sanitiza email y contraseña
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "El email es requerido",
    })
    .min(1, "El email es requerido")
    .email("Email inválido")
    .max(255, "El email es demasiado largo")
    .toLowerCase()
    .trim(),
  
  password: z
    .string({
      required_error: "La contraseña es requerida",
    })
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña es demasiado larga"),
});

/**
 * Esquema de validación para el registro
 * Valida y sanitiza todos los campos del formulario de registro
 */
export const registerSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre es requerido",
    })
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras")
    .trim(),
  
  apellido: z
    .string({
      required_error: "El apellido es requerido",
    })
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras")
    .trim(),
  
  email: z
    .string({
      required_error: "El email es requerido",
    })
    .min(1, "El email es requerido")
    .email("Email inválido")
    .max(255, "El email es demasiado largo")
    .toLowerCase()
    .trim(),
  
  contraseña: z
    .string({
      required_error: "La contraseña es requerida",
    })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  
  telefono: z
    .string({
      required_error: "El teléfono es requerido",
    })
    .min(1, "El teléfono es requerido")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono es demasiado largo")
    .regex(/^[0-9+\s()-]+$/, "El teléfono solo puede contener números y caracteres válidos (+, -, (), espacios)")
    .trim(),
});

// Tipos inferidos de los schemas para usar en TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
