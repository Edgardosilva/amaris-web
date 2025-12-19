"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verificarAdmin } from "@/app/actions/verificar-auth";
import { searchPatients, getPatientHistory } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calendar, Clock, DollarSign, FileText, ArrowLeft, Mail, Phone, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  nombre_paciente: string;
  total_citas: number;
  ultima_atencion: string;
  ultimo_procedimiento: string;
  emails_registrados: string;
  telefonos_registrados: string;
}

interface PatientHistory {
  id: number;
  fecha: string;
  hora: string;
  horaTermino: string;
  duracion: number;
  box: string;
  estado: string;
  procedimiento: string;
}

interface PatientData {
  nombre: string;
  solicitantes: Array<{
    nombre: string;
    email: string;
    telefono: string;
  }>;
}

interface PatientStats {
  total_citas: number;
  procedimientos_realizados: number;
  ultima_visita: string | null;
}

export default function PacientesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔐 Verificando acceso de admin...');
      const result = await verificarAdmin();
      
      if (!result.isAdmin) {
        console.log('❌ Acceso denegado:', result.error);
        router.push("/login");
        return;
      }

      console.log('✅ Usuario admin verificado');
      loadPatients();
    };

    checkAdminAccess();
  }, [router]);

  const loadPatients = async () => {
    setLoading(true);
    const result = await searchPatients("");
    if (result.success && result.patients) {
      setPatients(result.patients);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    const result = await searchPatients(searchQuery);
    if (result.success && result.patients) {
      setPatients(result.patients);
    }
    setLoading(false);
  };

  const handleViewHistory = async (paciente: Patient) => {
    setHistoryLoading(true);
    const result = await getPatientHistory(paciente.nombre_paciente);
    if (result.success && result.patient && result.history && result.stats) {
      setSelectedPatient(result.patient);
      setPatientHistory(result.history);
      setPatientStats(result.stats);
    }
    setHistoryLoading(false);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setPatientHistory([]);
    setPatientStats(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmada":
        return "bg-green-100 text-green-800";
      case "Completada":
        return "bg-blue-100 text-blue-800";
      case "Cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedPatient) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          onClick={handleBack}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a búsqueda
        </Button>

        <div className="bg-gradient-to-r from-[#52a2b2] to-[#458a98] text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">
                {selectedPatient.nombre}
              </h1>
              <div className="space-y-2">
                <p className="text-sm font-semibold opacity-90">Personas que han agendado para este paciente:</p>
                {selectedPatient.solicitantes.map((solicitante, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm">
                    <p className="font-semibold">{solicitante.nombre}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs opacity-90">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {solicitante.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {solicitante.telefono}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center ml-4">
              <User className="w-8 h-8 mx-auto mb-1" />
              <p className="text-xs opacity-90">Paciente</p>
            </div>
          </div>
        </div>

        {patientStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Citas</CardDescription>
                <CardTitle className="text-3xl text-[#52a2b2]">
                  {patientStats.total_citas}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Procedimientos Distintos</CardDescription>
                <CardTitle className="text-3xl text-[#a6d230]">
                  {patientStats.procedimientos_realizados}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Última Visita</CardDescription>
                <CardTitle className="text-lg text-[#52a2b2]">
                  {patientStats.ultima_visita 
                    ? format(new Date(patientStats.ultima_visita), "dd/MM/yyyy", { locale: es })
                    : "N/A"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historial de Atenciones
            </CardTitle>
            <CardDescription>
              Todos los procedimientos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#52a2b2] mx-auto"></div>
                <p className="text-muted-foreground mt-3">Cargando historial...</p>
              </div>
            ) : patientHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay historial de atenciones
              </div>
            ) : (
              <div className="space-y-3">
                {patientHistory.map((cita) => (
                  <div
                    key={cita.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-[#52a2b2]">
                            {cita.procedimiento}
                          </h3>
                          <Badge className={getEstadoColor(cita.estado)}>
                            {cita.estado}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(cita.fecha), "dd/MM/yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {cita.hora} - {cita.horaTermino}
                          </span>
                          <span className="flex items-center gap-1">
                            ⏱️ {cita.duracion} min
                          </span>
                          <span className="flex items-center gap-1">
                            📍 {cita.box}
                          </span>
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#52a2b2] mb-2">
            Historial de Pacientes
          </h1>
          <p className="text-muted-foreground">
            Busca y consulta el historial completo de atenciones de cada paciente
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Panel Admin
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, apellido, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[#52a2b2] hover:bg-[#458a98]"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#52a2b2] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pacientes...</p>
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <Card
              key={patient.nombre_paciente}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewHistory(patient)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-[#52a2b2] mb-1">
                      {patient.nombre_paciente}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <p className="flex items-center gap-1 text-xs">
                        <Mail className="w-3 h-3" />
                        {patient.emails_registrados || "Sin email"}
                      </p>
                      <p className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" />
                        {patient.telefonos_registrados || "Sin teléfono"}
                      </p>
                    </CardDescription>
                  </div>
                  <div className="bg-[#52a2b2]/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#52a2b2]">
                      {patient.total_citas}
                    </p>
                    <p className="text-xs text-muted-foreground">citas</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Última atención:</span>
                    <span className="font-medium">
                      {format(new Date(patient.ultima_atencion), "dd/MM/yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Último procedimiento:</span>
                    <span className="font-medium text-[#a6d230]">
                      {patient.ultimo_procedimiento}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-[#52a2b2] hover:bg-[#458a98]"
                  onClick={() => handleViewHistory(patient)}
                >
                  Ver Historial Completo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
