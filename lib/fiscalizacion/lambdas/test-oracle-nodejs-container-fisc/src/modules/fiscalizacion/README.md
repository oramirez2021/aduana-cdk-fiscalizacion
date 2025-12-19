# 📋 Módulo de Fiscalización

## 🚀 Inicio Rápido

```bash
# 1. Iniciar servidor
npm run start:oracle

# 2. Probar endpoint
npm run test:preparar-registro

# 3. Ver documentación Swagger
open http://localhost:3000/api/docs
```

## 📌 Endpoint Principal

**POST** `/api/fiscalizacion/preparar-registro`

Prepara datos para registro de fiscalización (individual o múltiple).

### Request
```json
{
  "guiasIds": [123456, 123457, 123458]
}
```

### Response
```json
{
  "guias": [
    { "id": 123456, "numeroDocumento": "1930729638" }
  ],
  "tipoFiscalizacion": {
    "codigo": "COURIER",
    "nombre": "COURIER"
  },
  "solicitantes": " / ARAOS Y, MARCELO",
  "resultadosDisponibles": [...],
  "datosIniciales": {...}
}
```

## 📚 Documentación Completa

Ver: [docs/MODULO_FISCALIZACION.md](../../../docs/MODULO_FISCALIZACION.md)

## 🏗️ Arquitectura

- **Controllers**: Endpoints REST
- **Services**: Lógica de negocio (usa SQL directo con oracledb)
- **Entities**: Mapeo de tablas Oracle
- **DTOs**: Validación y documentación de request/response

## ✅ Características

- ✅ Soporta selección individual y múltiple
- ✅ Consolida solicitantes automáticamente
- ✅ Optimizado (1 query vs N queries del monolito)
- ✅ Validación automática de DTOs
- ✅ Documentación Swagger integrada
- ✅ Compatible con Oracle 11g














