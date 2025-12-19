import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FiscalizacionService } from '../services/fiscalizacion.service';
import { FiscalizacionRegistroService } from '../services/fiscalizacion-registro.service';
import {
  PrepararRegistroRequestDto,
  PrepararRegistroResponseDto,
  PrepararRegistroIndividualRequestDto,
  PrepararRegistroIndividualResponseDto,
  AplicarRegistroRequestDto,
  AplicarRegistroResponseDto,
  EliminarRegistroResponseDto,
} from '../dto';

/**
 * Controlador de Fiscalización
 * Endpoints relacionados con operaciones de fiscalización
 */
@ApiTags('Fiscalización')
@Controller('api/fiscalizacion')
export class FiscalizacionController {
  private readonly logger = new Logger(FiscalizacionController.name);

  constructor(
    private readonly fiscalizacionService: FiscalizacionService,
    private readonly fiscalizacionRegistroService: FiscalizacionRegistroService,
  ) {}

  /**
   * Prepara datos para registro múltiple de fiscalización
   * Soporta selección de múltiples guías (N guías)
   *
   * Flujo:
   * 1. Obtiene información de guías seleccionadas
   * 2. Consulta acciones de fiscalización activas
   * 3. Obtiene catálogo de resultados disponibles
   * 4. Consolida solicitantes (si es múltiple)
   * 5. Prepara datos iniciales para el formulario
   *
   * @param dto - Array de IDs de guías seleccionadas
   * @returns Datos preparados para la pantalla de registro
   */
  @Post('preparar-registro-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preparar datos para registro múltiple de fiscalización',
    description: `
      Obtiene todos los datos necesarios para preparar la pantalla de registro múltiple de fiscalización.
      Este endpoint es específico para cuando se seleccionan **MÚLTIPLES GUÍAS** (N guías).
      
      **Diferencias con preparar-registro-individual:**
      - Recibe **un array de IDs** (no un solo ID)
      - **NO incluye** registros históricos (solo para individual)
      - Consolida nombres de solicitantes cuando hay múltiples guías
      
      **Proceso:**
      1. Valida que las guías existan
      2. Obtiene acciones de fiscalización activas (sin resultados registrados)
      3. Consulta catálogo de resultados disponibles según tipo de fiscalización
      4. Consolida nombres de solicitantes (si hay múltiples)
      5. Prepara valores iniciales del formulario
      
      **Optimización:**
      - Query de resultados se ejecuta solo 1 vez (no N veces como en el monolito)
      - Usa SQL directo con oracledb por compatibilidad con Oracle 11g
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos preparados exitosamente para el registro múltiple de fiscalización',
    type: PrepararRegistroResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos (ej: array vacío, IDs no numéricos)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Debe seleccionar al menos una guía', 'Cada ID debe ser un número']
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Guía(s) no encontrada(s) o sin acción de fiscalización activa',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'No se encontraron guías con acciones de fiscalización activas o ya tienen registros previos.' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor (ej: problema de conexión a base de datos)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error al consultar la base de datos' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async prepararRegistroMultiple(
    @Body() dto: PrepararRegistroRequestDto,
  ): Promise<PrepararRegistroResponseDto> {
    this.logger.log(
      `📋 Preparando registro múltiple para ${dto.guiasIds.length} guía(s)`,
    );

    const resultado = await this.fiscalizacionService.prepararRegistroMultiple(dto);

    this.logger.log(
      `✅ Registro múltiple preparado: ${resultado.guias.length} guía(s), ${resultado.resultadosDisponibles.length} resultado(s) disponible(s)`,
    );

    return resultado;
  }

  /**
   * Prepara datos para registro individual de fiscalización (1 sola guía)
   * Incluye registros históricos (sección "Registros Encontrados")
   *
   * Flujo completo:
   * 1. Obtiene información de la guía seleccionada
   * 2. Consulta acción de fiscalización activa (QAccionesFiscalizacionPorDocumento con ConResultados="N")
   * 3. Obtiene catálogo de resultados disponibles
   * 4. Consulta registros históricos de fiscalización (QRegistrosResultados)
   * 5. Prepara datos iniciales para el formulario
   *
   * Equivalente a la combinación de:
   * - MDetalleDocumento2.jsp (líneas 115-260, 362-365)
   * - SEjecucionAccionCourier.jsp (líneas 24-162)
   * - SeleccionRegistroFiscalizacionCourier.jsp (líneas 26-29, 423-434)
   *
   * @param dto - ID de la guía seleccionada
   * @returns Datos completos para la pantalla de registro individual
   */
  @Post('preparar-registro-individual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preparar datos para registro individual de fiscalización',
    description: `
      Obtiene todos los datos necesarios para preparar la pantalla de registro individual de fiscalización.
      Este endpoint es específico para cuando se selecciona **UNA SOLA GUÍA**.
      
      **Diferencias con preparar-registro:**
      - Recibe **1 solo ID** (no un array)
      - Incluye **registros históricos** (QRegistrosResultados) para la sección "Registros Encontrados"
      - Retorna información completa de la acción de fiscalización
      
      **Flujo completo replicado del monolito:**
      
      **PASO 1: MDetalleDocumento2.jsp**
      - Captura la guía seleccionada
      - Almacena datos en sesión (líneas 115-260)
      - Redirige a SEjecucionAccionCourier.jsp (líneas 362-365)
      
      **PASO 2: SEjecucionAccionCourier.jsp (pantalla transparente)**
      - Recupera datos de sesión (líneas 24-44)
      - Ejecuta QAccionesFiscalizacionPorDocumento con ConResultados="N" (líneas 82-109)
      - Carga el EJB OpFiscAccionFiscalizacion (líneas 110-136)
      - Redirige a SeleccionRegistroFiscalizacionCourier.jsp (líneas 140-162)
      
      **PASO 3: SeleccionRegistroFiscalizacionCourier.jsp**
      - Define columnas de "Registros Encontrados" (líneas 26-29)
      - Ejecuta QRegistrosResultados() para poblar la tabla (líneas 423-434)
      
      **PASO 4: OpFiscAccionFiscalizacion.QRegistrosResultados()**
      - Query SQL con funciones PL/SQL (líneas 1026-1037):
        * Gtime_getResultado(): concatena resultados
        * Gtime_getObservacion(): concatena observaciones
      - Formateo de fechas (líneas 1058-1069)
      
      **Columnas de "Registros Encontrados":**
      - **FechaEjecución**: Fecha de ejecución (DD/MM/YYYY)
      - **Fecha Registro en Sistema**: Fecha/hora de registro (DD/MM/YYYY HH24:MI:SS)
      - **Resultado(s)**: Códigos concatenados (ej: "CERTIFICADO PRESENTADO, CONFORME")
      - **Observación**: Observaciones concatenadas
      
      **Queries ejecutados (TAL CUAL del monolito):**
      1. QAccionesFiscalizacionPorDocumento (OpFiscAdministradorOperacion.java:1207-1222)
      2. QResultados (OpFiscTipoFiscalizacion.java)
      3. QRegistrosResultados (OpFiscAccionFiscalizacion.java:1026-1037)
      
      **Seguridad:**
      - Usa bind parameters (:1) para prevenir SQL injection
      - Compatible con Oracle 11g (ROWNUM, no FETCH NEXT)
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Datos preparados exitosamente para el registro individual.
    
    **Casos posibles:**
    - ✅ Con acción de fiscalización: Todos los campos llenos
    - ⚠️ Sin acción de fiscalización: Los campos accionFiscalizacion, tipoFiscalizacion y solicitante serán null, y los arrays estarán vacíos`,
    type: PrepararRegistroIndividualResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos (ej: ID no numérico)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['idGuia debe ser un número', 'El ID de la guía no puede estar vacío'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Guía no encontrada en la base de datos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Guía con ID 18931116 no encontrada',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor (ej: problema de conexión a base de datos)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error al consultar la base de datos' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async prepararRegistroIndividual(
    @Body() dto: PrepararRegistroIndividualRequestDto,
  ): Promise<PrepararRegistroIndividualResponseDto> {
    this.logger.log(
      `📋 Preparando registro individual para guía: ${dto.idGuia}`,
    );

    const resultado = await this.fiscalizacionService.prepararRegistroIndividual(dto);

    this.logger.log(
      `✅ Registro individual preparado: guía ${resultado.guia.numeroDocumento}, ${resultado.registrosHistoricos.length} registro(s) histórico(s), ${resultado.resultadosDisponibles.length} resultado(s) disponible(s)`,
    );

    return resultado;
  }

  /**
   * Aplica registro de fiscalización (botón "Aceptar")
   * Soporta una o múltiples guías con los mismos resultados/configuración
   *
   * Flujo:
   * 1. Valida que haya al menos un resultado
   * 2. Para cada documento:
   *    - Obtiene acción de fiscalización activa
   *    - Crea registro en OpFiscRegistroFiscalizaci
   *    - Crea resultados en OpFiscResultadoAccion
   *    - Actualiza estado del documento a "VIS" (VISADO)
   *    - Actualiza retenciones de la acción
   * 3. Retorna todos los registros creados
   *
   * @param dto - Datos del registro con documentos y resultados
   * @returns Registros creados exitosamente
   */
  @Post('aplicar-registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aplicar registro de fiscalización (Botón Aceptar)',
    description: `
      Aplica el registro de fiscalización para una o múltiples guías.
      Implementa la lógica completa del botón "Aceptar" del monolito.
      
      **Características principales:**
      - Soporta **1 o múltiples guías** (los mismos resultados se aplican a todas)
      - Los **resultados, denuncia y retenciones** son compartidos entre todas las guías
      - Cada guía genera un **registro independiente** en la base de datos
      
      **Proceso por cada guía:**
      1. ✅ **INSERT** en OpFiscRegistroFiscalizaci (registro principal)
      2. ✅ **INSERT** en OpFiscResultadoAccion (uno por resultado seleccionado)
      3. ✅ **SELECT** para obtener IdDocumentoAsociado
      4. ✅ **UPDATE** estado del documento a "VIS" (VISADO)
      5. ✅ **UPDATE** retenciones de la acción de fiscalización
      
      **Validaciones:**
      - Debe haber al menos un resultado seleccionado
      - Debe existir acción de fiscalización activa para cada guía
      
      **Equivalencia con el monolito:**
      - JSP: RegistroFiscalizacionCourier1.jsp (líneas 516-602)
      - Java: OpFiscAccionFiscalizacion.addRegistroFiscalizacion (líneas 1281-1429)
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registros de fiscalización aplicados exitosamente',
    type: AplicarRegistroResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o sin resultados',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Debe ingresar al menos un resultado en el registro',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No se encontró acción de fiscalización para alguna guía',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'No se encontró acción de fiscalización activa para guía 123456',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno durante el proceso de registro',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Error procesando documento 1930729638: Database error',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async aplicarRegistro(
    @Body() dto: AplicarRegistroRequestDto,
  ): Promise<AplicarRegistroResponseDto> {
    this.logger.log(
      `📝 Aplicando registro para ${dto.documentos.length} documento(s) con ${dto.resultadosIngresados.length} resultado(s)`,
    );

    const resultado = await this.fiscalizacionRegistroService.aplicarRegistro(
      dto,
    );

    this.logger.log(
      `✅ Registro aplicado exitosamente: ${resultado.registrosCreados} registro(s) creado(s)`,
    );

    return resultado;
  }

  /**
   * Elimina lógicamente un registro de fiscalización (soft delete)
   *
   * Flujo del monolito:
   * 1. Carga el registro seleccionado usando PRIMARY KEY compuesta (Id + IdOpFiscAccionFiscalizaci)
   * 2. Valida que existe y está activo
   * 3. Marca como eliminado (Activo='N', FechaDesactiva=NOW)
   * 4. La tabla se recarga automáticamente (solo muestra Activo='S')
   *
   * Monolito:
   * - SeleccionRegistroFiscalizacionCourier.jsp líneas 200-202, 293-305
   * - OpFiscRegistroFiscalizacion.java líneas 286-287 (Load), 703-709 (delete)
   * - OpFiscAccionFiscalizacion.java líneas 1045-1048 (Oid compuesto)
   *
   * @param idRegistro - ID del registro a eliminar
   * @param idAccionFiscalizacion - ID de la acción de fiscalización (parte de PK compuesta)
   * @returns Confirmación de eliminación con información del registro
   */
  @Delete('registros/:idRegistro/:idAccionFiscalizacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar registro de fiscalización (soft delete)',
    description: `
      Elimina lógicamente un registro de fiscalización marcándolo como inactivo.
      
      **PRIMARY KEY COMPUESTA:**
      La tabla OpFiscRegistroFiscalizaci tiene PRIMARY KEY compuesta:
      - Id (idRegistro)
      - IdOpFiscAccionFiscalizaci (idAccionFiscalizacion)
      
      **Características:**
      - Es un SOFT DELETE (no elimina físicamente el registro)
      - Establece Activo='N' y FechaDesactiva=NOW
      - No elimina los resultados asociados en OpFiscResultadoAccion
      - No modifica el estado del documento
      
      **Flujo del monolito:**
      1. Usuario selecciona un registro en la tabla (retorna Oid con ambos IDs)
      2. Hace clic en botón "Eliminar"
      3. Sistema carga el registro usando WHERE Id=X AND IdOpFiscAccionFiscalizaci=Y
      4. Marca el registro como inactivo
      5. Registro ya no aparece en la lista (query filtra por Activo='S')
      
      **Validaciones:**
      - El registro debe existir (usando ambas claves)
      - El registro debe estar activo (Activo='S')
      
      **Tablas afectadas:**
      - OpFiscRegistroFiscalizaci: UPDATE (Activo='N', FechaDesactiva=SYSDATE)
      
      **Datos disponibles en el frontend:**
      - idRegistro: viene en registrosHistoricos[].idRegistro
      - idAccionFiscalizacion: viene en accionFiscalizacion.id
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro eliminado exitosamente',
    type: EliminarRegistroResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Registro de fiscalización eliminado exitosamente',
        idRegistroEliminado: 7,
        fechaEliminacion: '2025-11-26T10:30:45.123Z',
        idAccionFiscalizacion: 1990046,
        numeroDocAsociado: 'GTIME-IVAD-JJ211025',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro no encontrado o ya eliminado',
    schema: {
      example: {
        statusCode: 404,
        message:
          'El registro de fiscalización con ID 7 y acción 1990046 no existe o ya fue eliminado',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'IDs inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error al eliminar el registro de fiscalización: Database error',
        error: 'Internal Server Error',
      },
    },
  })
  async eliminarRegistro(
    @Param('idRegistro', ParseIntPipe) idRegistro: number,
    @Param('idAccionFiscalizacion', ParseIntPipe) idAccionFiscalizacion: number,
  ): Promise<EliminarRegistroResponseDto> {
    this.logger.log(
      `🗑️  Solicitud de eliminación para registro ${idRegistro} de acción ${idAccionFiscalizacion}`,
    );

    const resultado =
      await this.fiscalizacionRegistroService.eliminarRegistro(
        idRegistro,
        idAccionFiscalizacion,
      );

    this.logger.log(
      `✅ Registro ${idRegistro} (acción ${idAccionFiscalizacion}) eliminado exitosamente (soft delete)`,
    );

    return resultado;
  }
}

