# 🚀 Cloud Run Checklist (Sin Sobrecostos)

Guía práctica para desplegar en Cloud Run minimizando riesgos de costos inesperados.

---

## 🧠 Objetivo

Evitar:
- Escalado descontrolado
- Costos inesperados
- Abuso por bots o tráfico malicioso

---

## 🧱 1. Configuración del servicio (CRÍTICO)

- Max instances: `1`
- Min instances: `0`
- CPU: `0.25` o `0.5`
- Memoria: `512MB`

💡 Esto limita el consumo máximo posible.

---

## 🧱 2. Concurrencia

- Concurrency: `1–10`

💡 Recomendado:
- Portafolio → `1`
- Apps pequeñas → `1–2`

---

## 🧱 3. Rate Limiting (Protección contra abuso)

Implementar en backend (Node.js):

Ejemplo conceptual:

```js
max 50–100 requests por minuto por IP