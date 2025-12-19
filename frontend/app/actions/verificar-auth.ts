"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://amaris-api-production.up.railway.app';

interface VerificarAuthResponse {
  isAuthenticated: boolean;
  userId?: string;
  rol?: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
}

export async function verificarAuth(): Promise<VerificarAuthResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { isAuthenticated: false };
    }

    // Verificar el token con el backend usando tu endpoint existente
    const response = await fetch(
      `${API_URL}/login/auth/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `access_token=${token}`,
        },
      }
    );

    if (!response.ok) {
      return { isAuthenticated: false };
    }

    const data = await response.json();
    
    // El endpoint devuelve { authenticated: boolean, user: {...} }
    return {
      isAuthenticated: data.authenticated || false,
      userId: data.user?.id,
      rol: data.user?.rol || 'usuario',
      user: data.user,
    };
  } catch (error) {
    console.error("Error al verificar autenticación:", error);
    return { isAuthenticated: false };
  }
}

export async function obtenerUsuarioActual(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return null;
    }

    // Obtener usuario actual usando tu endpoint existente
    const response = await fetch(
      `${API_URL}/login/auth/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `access_token=${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // El endpoint devuelve { authenticated: boolean, user: {...} }
    if (data.authenticated && data.user) {
      return data.user.id;
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    return null;
  }
}

/**
 * Verifica si el usuario actual tiene rol de admin
 */
export async function verificarAdmin(): Promise<{ isAdmin: boolean; user?: any; error?: string }> {
  try {
    const authResult = await verificarAuth();

    if (!authResult.isAuthenticated || !authResult.user) {
      return {
        isAdmin: false,
        error: "No autenticado"
      };
    }

    if (authResult.user.rol !== 'admin') {
      return {
        isAdmin: false,
        error: "No tienes permisos de administrador"
      };
    }

    return {
      isAdmin: true,
      user: authResult.user,
    };
  } catch (error) {
    console.error("Error al verificar admin:", error);
    return {
      isAdmin: false,
      error: "Error al verificar permisos"
    };
  }
}
