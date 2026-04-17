# Amaris - Centro de Kinesiología Estética

Sistema completo de gestión de citas para Amaris, desarrollado con Next.js 15 y Node.js/Express.

## 📁 Estructura del Proyecto

```
amaris-landing/
├── .github/
│   └── workflows/
│       └── backend.yml        # Pipeline CI/CD → Cloud Run
├── frontend/                  # Next.js 15.5.4 - App Router (Vercel)
│   ├── app/              # Rutas y páginas
│   │   ├── page.tsx                    # Página principal
│   │   ├── login/                      # Login
│   │   ├── register/                   # Registro
│   │   ├── servicios/                  # Catálogo de servicios
│   │   ├── dashboard/                  # Dashboard de usuario
│   │   └── agendar/                   # Flujo de reserva (4 pasos)
│   │       ├── paso-1/                # Datos personales
│   │       ├── paso-2/                # Selección de servicio
│   │       ├── paso-3/                # Fecha y hora
│   │       └── paso-4/                # Confirmación
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/          # Componentes shadcn/ui
│   │   ├── navigation.tsx
│   │   └── footer.tsx
│   ├── hooks/           # Custom hooks (Zustand store)
│   └── lib/             # Utilidades
│
├── backend/                  # Node.js + Express + PostgreSQL (Cloud Run)
│   ├── controllers/         # Lógica de negocio
│   ├── routes/              # Rutas de la API
│   ├── helpers/             # Servicios (email, validaciones)
│   ├── middleware/          # Auth, validación, rate limiting
│   ├── Dockerfile           # Imagen para Cloud Run
│   └── database.js          # Conexión PostgreSQL (Supabase)
│
└── README.md
```

## 🎨 Tecnologías

### Frontend
- **Framework**: Next.js 15.5.4 (App Router, Server Actions)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS v3.4 + shadcn/ui
- **State Management**: Zustand (con persist middleware)
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Calendar**: react-day-picker + date-fns
- **Icons**: Lucide React
- **Notifications**: SweetAlert2, Sonner

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL vía **Supabase**
- **Hosting**: Google **Cloud Run** (us-central1)
- **CI/CD**: GitHub Actions con Workload Identity Federation
- **Authentication**: JWT + HttpOnly Cookies
- **Security**: bcryptjs, CORS, express-rate-limit (60 req/min por IP)

## 🎨 Colores de Marca
- **Primario**: `#52a2b2` (Azul Amaris)
- **Acento**: `#a6d230` (Verde)

##  Despliegue

### Arquitectura de Producción

| Servicio | Plataforma | URL |
|----------|-----------|-----|
| Frontend | Vercel | https://amairsweb.vercel.app |
| Backend API | Google Cloud Run | Se obtiene al desplegar |
| Base de datos | Supabase (PostgreSQL) | Gestionado en Supabase |

### CI/CD — GitHub Actions

El pipeline (`.github/workflows/backend.yml`) se activa automáticamente al hacer push a `main` con cambios en `backend/`.

1. **Test** — Ejecuta la suite de tests con Jest
2. **Auth** — Autenticación keyless con Google Cloud via Workload Identity Federation
3. **Build & Push** — Construye la imagen Docker y la publica en Artifact Registry
4. **Deploy** — Despliega la nueva imagen en Cloud Run

## �️ Base de Datos (Supabase + PostgreSQL)


### Tablas Principales
- `usuarios_registrados` — Usuarios del sistema
- `procedimientos_disponibles` — Catálogo de servicios
- `citas_agendadas` — Reservas y citas
- `horarios_disponibles` — Disponibilidad de horarios

## 🔐 Autenticación

El sistema usa JWT con HttpOnly cookies para seguridad:
1. Usuario se registra o hace login
2. Backend genera JWT y lo envía en header `Set-Cookie`
3. Frontend extrae el token y lo guarda
4. Las peticiones subsecuentes incluyen el token automáticamente


## 🎯 Funcionalidades Principales

### Para Usuarios
- ✅ Registro e inicio de sesión
- ✅ Ver catálogo de servicios
- ✅ Agendar citas (flujo de 4 pasos)
- ✅ Ver historial de citas en dashboard
- ✅ Responsive design (mobile-first)

### Sistema de Reservas
1. **Paso 1**: Ingreso de datos personales
2. **Paso 2**: Selección de servicio/procedimiento
3. **Paso 3**: Elección de fecha y hora disponible
4. **Paso 4**: Resumen y confirmación
5. **Dashboard**: Visualización de citas agendadas

##  Notas Técnicas

### Estado Global (Zustand)
El estado se persiste en `localStorage` con la key `"amaris-form-storage"`:
- Datos del usuario autenticado
- Progreso del flujo de reserva
- Datos del formulario entre pasos

### Server Actions
Next.js 15 usa Server Actions para las peticiones al backend:
- `app/actions/auth.ts` — Login/Registro
- `app/actions/citas.ts` — Crear citas
- `app/actions/appointments.ts` — Obtener citas
- `app/actions/horarios.ts` — Disponibilidad

### Optimizaciones
- ✅ Rate limiting: 60 req/min por IP
- ✅ Caché de Next.js configurado
- ✅ Componentes optimizados con React 19
- ✅ Imágenes optimizadas con Next/Image


