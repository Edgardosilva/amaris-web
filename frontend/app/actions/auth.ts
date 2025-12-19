"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { ZodError } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://amaris-api-production.up.railway.app';

export async function loginAction(formData: FormData) {
  // Extraer datos del formulario
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validar y sanitizar con Zod
  try {
    const validatedData = loginSchema.parse(rawData);
    
    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validatedData.email,
          contraseña: validatedData.password,
        }),
      }
    );
    
    if (!response.ok) {
      return { 
        success: false, 
        error: "Correo o contraseña incorrectos" 
      };
    }
    
    const data = await response.json();
    
    // El backend envía el token como cookie en el Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    
    // Extraer el token de la cookie
    let token = null;
    if (setCookieHeader) {
      const match = setCookieHeader.match(/access_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    
    // Fallback: intentar obtener del body JSON
    if (!token) {
      token = data.token || data.access_token || data.accessToken;
    }
    
    if (!token) {
      return {
        success: false,
        error: "Error al obtener el token de autenticación"
      };
    }
    
    // Guardar token en cookies de Next.js
    const cookieStore = await cookies();
    cookieStore.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });
    
    // Preparar información del usuario
    const userInfo = {
      id: data.user?.id || data.id || "",
      nombre: data.user?.nombre || data.nombre || "",
      apellido: data.user?.apellido || data.apellido || "",
      email: data.user?.email || data.email || validatedData.email,
      telefono: data.user?.telefono || data.telefono || "",
      rol: data.user?.rol || "usuario",
    };
    
    return { 
      success: true,
      user: userInfo
    };
  } catch (error) {
    // Manejar errores de validación de Zod
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }
    
    console.error("Error al hacer login:", error);
    return { 
      success: false, 
      error: "Hubo un problema con el servidor" 
    };
  }
}

export async function registerAction(formData: FormData) {
  // Extraer datos del formulario
  const rawData = {
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
    email: formData.get("email") as string,
    contraseña: formData.get("contraseña") as string,
    telefono: formData.get("telefono") as string,
  };

  // Validar y sanitizar con Zod
  try {
    const validatedData = registerSchema.parse(rawData);
    
    const response = await fetch(
      `${API_URL}/login/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: validatedData.nombre,
          apellido: validatedData.apellido,
          email: validatedData.email,
          contraseña: validatedData.contraseña,
          telefono: validatedData.telefono,
        }),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Hubo un problema al crear tu cuenta.",
      };
    }
    return { success: true };
  } catch (error) {
    // Manejar errores de validación de Zod
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }
    
    console.error("Error al registrar:", error);
    return {
      success: false,
      error: "No se pudo conectar con el servidor. Intenta nuevamente.",
    };
  }
}
