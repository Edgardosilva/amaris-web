"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import { verificarAdmin } from "@/app/actions/verificar-auth";
import { getAllAppointments, type Appointment } from "@/app/actions/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut, Users, Clock, CheckCircle, XCircle, UserSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Cita {
  id: number;
  title: string;
  start: string;
  estado: string;
  procedimiento?: string;
  paciente?: string;
  solicitante?: string;
  fecha?: string;
  hora?: string;
  horaTermino?: string;
  box?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    confirmadas: 0,
    pendientes: 0,
    canceladas: 0
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔐 Verificando acceso de admin...');
      const result = await verificarAdmin();
      
      if (!result.isAdmin) {
        console.log('❌ Acceso denegado:', result.error);
        router.push("/login");
        return;
      }

      console.log('✅ Usuario admin verificado, cargando citas');
      fetchAllAppointments();
    };

    checkAdminAccess();
  }, [router]);

  const fetchAllAppointments = async () => {
    try {
      console.log('📡 Obteniendo todas las citas desde Server Action...');
      const result = await getAllAppointments();

      if (result.success && result.appointments) {
        console.log('🔍 Primera cita raw:', result.appointments[0]); // Debug
        
        const citasFormateadas = result.appointments.map(appt => {
          // Formatear la fecha correctamente desde MySQL
          const fechaISO = appt.fecha.includes('T') 
            ? appt.fecha.split('T')[0] 
            : appt.fecha;
          
          return {
            id: parseInt(appt.id),
            title: `${appt.nombre_procedimiento} - ${appt.paciente_atendido}`,
            start: `${fechaISO}T${appt.hora}`,
            estado: appt.estado,
            procedimiento: appt.nombre_procedimiento,
            paciente: appt.paciente_atendido,
            solicitante: appt.solicitante,
            fecha: fechaISO,
            hora: appt.hora,
            horaTermino: appt.horaTermino,
            box: appt.box || "N/A"
          };
        });

        console.log('🔍 Primera cita formateada:', citasFormateadas[0]); // Debug
        setCitas(citasFormateadas);
        
        // Calcular estadísticas
        const stats = {
          total: citasFormateadas.length,
          confirmadas: citasFormateadas.filter((c) => c.estado === "Confirmada").length,
          pendientes: citasFormateadas.filter((c) => c.estado === "Pendiente").length,
          canceladas: citasFormateadas.filter((c) => c.estado === "Cancelada").length
        };
        setStats(stats);
        console.log('✅ Citas cargadas:', stats);
      } else {
        console.error('❌ Error al obtener citas:', result.error);
        if (result.error?.includes("permisos")) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/");
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "Confirmada":
        return <Badge className="bg-green-500">Confirmada</Badge>;
      case "Pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "Cancelada":
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Si dateString ya tiene formato ISO completo, tomar solo la fecha
      const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
      
      // Crear fecha en UTC para evitar problemas de zona horaria
      const [year, month, day] = dateOnly.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', dateString);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'Error en fecha';
    }
  };

  // Mostrar loading mientras hidrata o carga datos
  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent/20 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground mt-2">
              Bienvenido, {user?.nombre} {user?.apellido}
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/pacientes")}
            className="bg-[#52a2b2] hover:bg-[#458a98]"
          >
            <UserSearch className="w-4 h-4 mr-2" />
            Historial de Pacientes
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.confirmadas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pendientes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.canceladas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Citas Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            {citas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay citas agendadas
              </p>
            ) : (
              <div className="space-y-4">
                {citas.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{cita.title}</h3>
                        {getStateBadge(cita.estado)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {cita.fecha && formatDate(cita.fecha)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {cita.hora}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                           {cita.box ? cita.box : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
