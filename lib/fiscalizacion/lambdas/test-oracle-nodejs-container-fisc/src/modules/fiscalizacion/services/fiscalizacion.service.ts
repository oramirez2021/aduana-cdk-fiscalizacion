import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseOracleService } from '../../../shared/base-oracle.service';
import { ConfigService } from '@nestjs/config';
import {
  PrepararRegistroRequestDto,
  PrepararRegistroResponseDto,
  PrepararRegistroIndividualRequestDto,
  PrepararRegistroIndividualResponseDto,
  GuiaInfoDto,
  TipoFiscalizacionDto,
  ResultadoDisponibleDto,
  DatosInicialesDto,
} from '../dto';
import { 
  AccionFiscalizacionDto, 
  RegistroHistoricoDto 
} from '../dto/preparar-registro-individual-response.dto';
import { DocDocumentoBase, OpFiscResultado } from '../entities';

/**
 * Servicio de Fiscalización
 * Implementa lógica de negocio para preparar registros de fiscalización
 * Usa arquitectura mixta: TypeORM para queries simples, SQL directo para queries complejas
 */
@Injectable()
export class FiscalizacionService extends BaseOracleService {
  protected readonly logger = new Logger(FiscalizacionService.name);

  constructor(
    protected readonly configService: ConfigService,
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
    @InjectRepository(OpFiscResultado)
    private readonly opFiscResultadoRepository: Repository<OpFiscResultado>,
  ) {
    super(configService);
  }

  /**
   * Prepara datos para registro de fiscalización (individual o múltiple)
   * Ejecuta el flujo completo:
   * 1. Obtiene información de guías
   * 2. Consulta acciones de fiscalización por cada guía
   * 3. Obtiene resultados disponibles
   * 4. Consolida solicitantes
   */
  async prepararRegistroMultiple(
    dto: PrepararRegistroRequestDto,
  ): Promise<PrepararRegistroResponseDto> {
    this.logger.log(
      `Preparando registro múltiple para ${dto.guiasIds.length} guía(s): ${dto.guiasIds.join(', ')}`,
    );

    const guias: GuiaInfoDto[] = [];
    let tipoFiscalizacion: TipoFiscalizacionDto = null;
    const solicitantes: string[] = [];

    // Procesar cada guía seleccionada
    for (const guiaId of dto.guiasIds) {
      // 1. Obtener información básica de la guía
      const guiaInfo = await this.obtenerInfoGuia(guiaId);
      guias.push(guiaInfo);

      // 2. Obtener acción de fiscalización para esta guía
      const accion = await this.obtenerAccionFiscalizacionPorDocumento(guiaId);

      if (!accion) {
        throw new NotFoundException(
          `No se encontró acción de fiscalización activa para guía ${guiaId}`,
        );
      }

      // 3. Guardar tipo de fiscalización (debe ser el mismo para todas)
      if (!tipoFiscalizacion) {
        tipoFiscalizacion = {
          codigo: accion.tipoFiscalizacionCodigo,
          nombre: accion.tipoFiscalizacionNombre,
        };
      }

      // 4. Guardar solicitante
      solicitantes.push(accion.nombreSolicitante);
    }

    // 5. Obtener resultados disponibles (solo 1 vez, optimización del monolito)
    const resultadosDisponibles = await this.obtenerResultadosDisponibles(
      tipoFiscalizacion.codigo,
    );

    // 6. Consolidar solicitantes
    const solicitantesConsolidados = this.consolidarSolicitantes(solicitantes);

    // 7. Preparar datos iniciales
    const datosIniciales: DatosInicialesDto = {
      numeroDenuncia: '',
      opAduaneraRetenida: 'N',
      opTransporteRetenida: 'N',
    };

    return {
      guias,
      tipoFiscalizacion,
      solicitantes: solicitantesConsolidados,
      resultadosDisponibles,
      datosIniciales,
    };
  }

  /**
   * Obtiene información básica de una guía
   * Raw SQL - Oracle 11g no soporta FETCH NEXT (solo ROWNUM)
   */
  private async obtenerInfoGuia(guiaId: number): Promise<GuiaInfoDto> {
    const result = await this.executeQuery<{ 
      ID: number; 
      NUMERODOC: string;
      TIPODOCUMENTO: string;
    }>(
      `SELECT ID, 
              NUMEROEXTERNO AS NUMERODOC,
              TIPODOCUMENTO
       FROM DOCUMENTOS.DOCDOCUMENTOBASE 
       WHERE ID = :1 AND ROWNUM <= 1`,
      [guiaId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundException(`Guía con ID ${guiaId} no encontrada`);
    }

    return {
      id: result[0].ID,
      numeroDocumento: result[0].NUMERODOC,
      codigoTipoDocumento: result[0].TIPODOCUMENTO,
    };
  }

  /**
   * Obtiene acción de fiscalización para un documento
   * Query equivalente a OpFiscAdministradorOperacion.QAccionesFiscalizacionPorDocumento
   */
  private async obtenerAccionFiscalizacionPorDocumento(
    idDocumento: number,
  ): Promise<any> {
    const sql = `
      SELECT DISTINCT 
            OpFiscAccionFiscalizacion.Id As Id,
            OpFiscAccionFiscalizacion.Id As OpFiscAccionF_Id000, 
            OpFiscAccionFiscalizacion.FechaPlanificada As OpFiscAccionF_FechaPlanific001, 
            OpFiscAccionFiscalizacion.FechaEjecucion As OpFiscAccionF_FechaEjecucio002, 
            OpFiscAccionFiscalizacion.IdSolicitante As OpFiscAccionF_IdSolicitante003, 
            OpFiscAccionFiscalizacion.NombreSolicitante As OpFiscAccionF_NombreSolicit004, 
            OpFiscAccionFiscalizacion.Descripcion As OpFiscAccionF_Descripcion005,
            Tipo.Codigo As Tipo_Codigo, 
            Tipo.Nombre As Tipo_Nombre, 
            Tipo.Descripcion As Tipo_Descripcion008
      FROM OpFiscAccionFiscalizacion OpFiscAccionFiscalizacion,
           OpFiscOperacion Operacion,
           OpFiscMarca Marcas,
           OpFiscTipoFiscalizacion Tipo
      WHERE Operacion.Id = OpFiscAccionFiscalizacion.IdOpFiscOperacion
        AND Marcas.IdOpFiscOperacion = Operacion.Id
        AND Marcas.IdDocumento = :1
        AND Marcas.Activa = 'S'
        AND Tipo.Codigo = OpFiscAccionFiscalizacion.CodigoOpFiscTipoFiscaliza
        AND OpFiscAccionFiscalizacion.Activa = 'S'
    `;

    const result = await this.executeQuery<any>(sql, [idDocumento]);

    if (!result || result.length === 0) {
      return null;
    }

    // Retornar la primera acción encontrada
    return {
      accionId: result[0].ID,
      fechaPlanificada: result[0].OPFISCACCIONF_FECHAPLANIFIC001,
      fechaEjecucion: result[0].OPFISCACCIONF_FECHAEJECUCIO002,
      idSolicitante: result[0].OPFISCACCIONF_IDSOLICITANTE003,
      nombreSolicitante: result[0].OPFISCACCIONF_NOMBRESOLICIT004,
      descripcion: result[0].OPFISCACCIONF_DESCRIPCION005,
      tipoFiscalizacionCodigo: result[0].TIPO_CODIGO,
      tipoFiscalizacionNombre: result[0].TIPO_NOMBRE,
      tipoFiscalizacionDescripcion: result[0].TIPO_DESCRIPCION008,
    };
  }

  /**
   * Obtiene resultados disponibles para un tipo de fiscalización
   * Query equivalente a OpFiscTipoFiscalizacion.QResultados
   * Raw SQL - Oracle 11g no soporta FETCH NEXT (solo ROWNUM)
   */
  private async obtenerResultadosDisponibles(
    codigoTipoFiscalizacion: string,
  ): Promise<ResultadoDisponibleDto[]> {
    const resultados = await this.executeQuery<{
      CODIGO: string;
      DESCRIPCION: string;
      LIBERAOPADUANERA: string;
      LIBERAOPTRANSPORTE: string;
    }>(
      `SELECT OpFiscResultado.Codigo,
              OpFiscResultado.Descripcion,
              OpFiscResultado.LiberaOpAduanera,
              OpFiscResultado.LiberaOpTransporte
       FROM OpFiscResultado
       WHERE OpFiscResultado.CodigoOpFiscTipoFiscaliza = :1
         AND OpFiscResultado.Activa = 'S'
       ORDER BY OpFiscResultado.Descripcion`,
      [codigoTipoFiscalizacion]
    );

    return resultados.map((resultado) => ({
      codigo: resultado.CODIGO,
      descripcion: resultado.DESCRIPCION,
      liberaOpAduanera: resultado.LIBERAOPADUANERA,
      liberaOpTransporte: resultado.LIBERAOPTRANSPORTE,
    }));
  }

  /**
   * Prepara datos para registro individual de fiscalización
   * Ejecuta el flujo completo para UNA SOLA GUÍA:
   * 1. Obtiene información de la guía
   * 2. Consulta acción de fiscalización activa (QAccionesFiscalizacionPorDocumento)
   * 3. Obtiene resultados disponibles
   * 4. Consulta registros históricos (QRegistrosResultados)
   * 
   * Flujo equivalente a:
   * - MDetalleDocumento2.jsp (líneas 115-260, 362-365)
   * - SEjecucionAccionCourier.jsp (líneas 24-162)
   * - SeleccionRegistroFiscalizacionCourier.jsp (líneas 26-29, 423-434)
   * - OpFiscAccionFiscalizacion.QRegistrosResultados (líneas 1026-1069)
   */
  async prepararRegistroIndividual(
    dto: PrepararRegistroIndividualRequestDto,
  ): Promise<PrepararRegistroIndividualResponseDto> {
    this.logger.log(
      `Preparando registro individual para guía: ${dto.idGuia}`,
    );

    // 1. Obtener información básica de la guía (incluye tipo de documento)
    const guia = await this.obtenerInfoGuia(dto.idGuia);

    // 2. Obtener acción de fiscalización activa para este documento
    // Query equivalente a OpFiscAdministradorOperacion.QAccionesFiscalizacionPorDocumento
    // con parámetro ConResultados="N" (línea 82-109 de SEjecucionAccionCourier.jsp)
    const accionData = await this.obtenerAccionFiscalizacionPorDocumento(dto.idGuia);

    // Si no hay acción de fiscalización, retornar respuesta con campos null (HTTP 200)
    if (!accionData) {
      return {
        guia,
        accionFiscalizacion: null,
        tipoFiscalizacion: null,
        solicitante: null,
        resultadosDisponibles: [],
        registrosHistoricos: [],
        datosIniciales: {
          numeroDenuncia: '',
          opAduaneraRetenida: 'N',
          opTransporteRetenida: 'N',
        },
      };
    }

    // 3. Construir DTO de acción de fiscalización
    const accionFiscalizacion: AccionFiscalizacionDto = {
      id: accionData.accionId,
      idSolicitante: accionData.idSolicitante,
      nombreSolicitante: accionData.nombreSolicitante,
      descripcion: accionData.descripcion,
      fechaPlanificada: accionData.fechaPlanificada,
      fechaEjecucion: accionData.fechaEjecucion,
    };

    // 4. Construir DTO de tipo de fiscalización
    const tipoFiscalizacion: TipoFiscalizacionDto = {
      codigo: accionData.tipoFiscalizacionCodigo,
      nombre: accionData.tipoFiscalizacionNombre,
      descripcion: accionData.tipoFiscalizacionDescripcion,
    };

    // 5. Obtener resultados disponibles (solo 1 vez)
    const resultadosDisponibles = await this.obtenerResultadosDisponibles(
      tipoFiscalizacion.codigo,
    );

    // 6. Obtener registros históricos (QRegistrosResultados)
    // Query equivalente a OpFiscAccionFiscalizacion.QRegistrosResultados (líneas 1026-1069)
    const registrosHistoricos = await this.obtenerRegistrosHistoricos(accionFiscalizacion.id);

    // 7. Preparar solicitante en formato individual
    const solicitante = ' / ' + accionData.nombreSolicitante;

    // 8. Preparar datos iniciales
    // Obtener último registro ACTIVO de esta guía específica para prellenar
    let datosIniciales: DatosInicialesDto;
    
    const ultimoRegistro = await this.obtenerDatosInicialesUltimoRegistro(
      accionFiscalizacion.id,
      dto.idGuia,
    );

    if (ultimoRegistro) {
      // Hay un registro previo activo, prellenar con esos datos
      datosIniciales = {
        numeroDenuncia: ultimoRegistro.codigoDenuncia || '',
        opAduaneraRetenida: ultimoRegistro.opAduaneraRetenida,
        opTransporteRetenida: ultimoRegistro.opTransporteRetenida,
      };
    } else {
      // No hay registros previos (primera vez), usar valores por defecto
      datosIniciales = {
        numeroDenuncia: '',
        opAduaneraRetenida: 'N',
        opTransporteRetenida: 'N',
      };
    }

    return {
      guia,
      accionFiscalizacion,
      tipoFiscalizacion,
      solicitante,
      resultadosDisponibles,
      registrosHistoricos,
      datosIniciales,
    };
  }

  /**
   * Obtiene registros históricos de fiscalización para una acción
   * Query equivalente a OpFiscAccionFiscalizacion.QRegistrosResultados()
   * Líneas 1026-1037 de OpFiscAccionFiscalizacion.java
   * 
   * Usa funciones PL/SQL del monolito:
   * - documentos.courier_consultas.Gtime_getResultado(idopfiscaccionfiscalizaci, id): concatena resultados
   * - documentos.courier_consultas.Gtime_getObservacion(idopfiscaccionfiscalizaci, id): concatena observaciones
   */
  private async obtenerRegistrosHistoricos(
    idAccionFiscalizacion: number,
  ): Promise<RegistroHistoricoDto[]> {
    // Query LITERAL del monolito (líneas 1026-1037 de OpFiscAccionFiscalizacion.java)
    const sql = `
      SELECT OpFiscRegistroFiscalizacion.Id As Id, 
             OpFiscRegistroFiscalizacion.IdOpFiscAccionFiscalizaci As IdOpFiscAccionFiscalizaci,
             OpFiscRegistroFiscalizacion.Id As OpFiscRegistr_Id000, 
             OpFiscRegistroFiscalizacion.NumeroDocAsociado As OpFiscRegistr_NumeroDocAsoc001, 
             OpFiscRegistroFiscalizacion.CodigoTipoDocumento As OpFiscRegistr_CodigoTipoDoc002, 
             OpFiscRegistroFiscalizacion.IdDocumentoAsociado As OpFiscRegistr_IdDocumentoAs003, 
             OpFiscRegistroFiscalizacion.IdentificacionVehiculo As OpFiscRegistr_Identificacio004, 
             OpFiscRegistroFiscalizacion.FechaEjecucion As OpFiscRegistr_FechaEjecucio005, 
             OpFiscRegistroFiscalizacion.OpAduaneraRetenida As OpFiscRegistr_OpAduaneraRet006, 
             OpFiscRegistroFiscalizacion.OpTransporteRetenida As OpFiscRegistr_OpTransporteR007, 
             OpFiscRegistroFiscalizacion.IdEjecutante As OpFiscRegistr_IdEjecutante008, 
             OpFiscRegistroFiscalizacion.NombreEjecutante As OpFiscRegistr_NombreEjecuta009,
             to_char(OPFISCREGISTROFISCALIZACION.FECHAACTIVA,'dd-mm-yyyy hh24:mi') fecha_activa,
             documentos.courier_consultas.Gtime_getResultado(idopfiscaccionfiscalizaci, id) resultados_ingresados,
             documentos.courier_consultas.Gtime_getObservacion(idopfiscaccionfiscalizaci, id) observaciones
      FROM fiscalizaciones.OpFiscRegistroFiscalizaci OpFiscRegistroFiscalizacion
      WHERE (OpFiscRegistroFiscalizacion.IdOpFiscAccionFiscalizaci = :1)
        AND OpFiscRegistroFiscalizacion.Activo = 'S'
      ORDER BY OpFiscRegistr_NumeroDocAsoc001
    `;

    const result = await this.executeQuery<{
      ID: number;
      IDOPFISCACCIONFISCALIZACI: number;
      OPFISCREGISTR_ID000: number;
      OPFISCREGISTR_NUMERODOCASOC001: string;
      OPFISCREGISTR_CODIGOTIPODOC002: string;
      OPFISCREGISTR_IDDOCUMENTOAS003: number;
      OPFISCREGISTR_IDENTIFICACIO004: string;
      OPFISCREGISTR_FECHAEJECUCIO005: Date;
      OPFISCREGISTR_OPADUANERET006: string;
      OPFISCREGISTR_OPTRANSPORTER007: string;
      OPFISCREGISTR_IDEJECUTANTE008: number;
      OPFISCREGISTR_NOMBREEJECUTA009: string;
      FECHA_ACTIVA: string;
      RESULTADOS_INGRESADOS: string;
      OBSERVACIONES: string;
    }>(sql, [idAccionFiscalizacion]);

    // Formatear fechas según el monolito (líneas 1058-1069)
    // Usar fecha_activa que ya viene formateada del query
    return result.map((row) => ({
      idRegistro: row.ID, // ID del registro para poder eliminarlo después
      fechaEjecucion: this.formatearFecha(row.OPFISCREGISTR_FECHAEJECUCIO005, 'dd/MM/yyyy'),
      fechaSysRegistro: row.FECHA_ACTIVA || '', // Ya viene formateada del to_char
      resultados: row.RESULTADOS_INGRESADOS || '',
      observaciones: row.OBSERVACIONES || '',
    }));
  }

  /**
   * Obtiene datos iniciales del último registro activo de una guía específica
   * Para prellenar el formulario después de crear/modificar un registro
   * 
   * Filtra por:
   * - IdOpFiscAccionFiscalizaci: Acción de fiscalización específica
   * - IdDocumentoAsociado: Guía específica
   * - Activo = 'S': Solo registros activos
   * 
   * Ordena por Id DESC para obtener el más reciente
   */
  private async obtenerDatosInicialesUltimoRegistro(
    idAccionFiscalizacion: number,
    idDocumento: number,
  ): Promise<{
    codigoDenuncia: string | null;
    opAduaneraRetenida: string;
    opTransporteRetenida: string;
  } | null> {
    const sql = `
      SELECT * FROM (
        SELECT OpFiscRegistroFiscalizacion.CodigoDenuncia,
               OpFiscRegistroFiscalizacion.OpAduaneraRetenida,
               OpFiscRegistroFiscalizacion.OpTransporteRetenida
        FROM fiscalizaciones.OpFiscRegistroFiscalizaci OpFiscRegistroFiscalizacion
        WHERE OpFiscRegistroFiscalizacion.IdOpFiscAccionFiscalizaci = :1
          AND OpFiscRegistroFiscalizacion.IdDocumentoAsociado = :2
          AND OpFiscRegistroFiscalizacion.Activo = 'S'
        ORDER BY OpFiscRegistroFiscalizacion.Id DESC
      ) WHERE ROWNUM = 1
    `;

    const result = await this.executeQuery<{
      CODIGODENUNCIA: string | null;
      OPADUANERARETENIDA: string;
      OPTRANSPORTERETENIDA: string;
    }>(sql, [idAccionFiscalizacion, idDocumento]);

    if (!result || result.length === 0) {
      return null;
    }

    return {
      codigoDenuncia: result[0].CODIGODENUNCIA,
      opAduaneraRetenida: result[0].OPADUANERARETENIDA,
      opTransporteRetenida: result[0].OPTRANSPORTERETENIDA,
    };
  }

  /**
   * Formatea una fecha según el patrón especificado
   * Equivalente a Formatter.FormatDate del monolito
   */
  private formatearFecha(fecha: Date, patron: string): string {
    if (!fecha) return '';

    const fechaObj = new Date(fecha);
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const anio = fechaObj.getFullYear();

    if (patron === 'dd/MM/yyyy') {
      return `${dia}/${mes}/${anio}`;
    }

    if (patron === 'dd/MM/yyyy HH24:MI:SS') {
      const horas = String(fechaObj.getHours()).padStart(2, '0');
      const minutos = String(fechaObj.getMinutes()).padStart(2, '0');
      const segundos = String(fechaObj.getSeconds()).padStart(2, '0');
      return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
    }

    return fecha.toISOString();
  }

  /**
   * Consolida lista de solicitantes
   * Lógica equivalente a líneas 512-540 de MDetalleDocumento3.jsp
   *
   * Si todos son iguales: "ARAOS Y, MARCELO"
   * Si hay diferentes: " / ARAOS Y, MARCELO / GONZALEZ P, JUAN"
   */
  private consolidarSolicitantes(solicitantes: string[]): string {
    if (solicitantes.length === 0) return '';
    if (solicitantes.length === 1) return ' / ' + solicitantes[0];

    // Contar ocurrencias de cada solicitante
    const conteo = new Map<string, number>();
    solicitantes.forEach((sol) => {
      conteo.set(sol, (conteo.get(sol) || 0) + 1);
    });

    // Separar repetidos de únicos
    const repetidos: string[] = [];
    const unicos: string[] = [];

    conteo.forEach((count, solicitante) => {
      if (count > 1) {
        repetidos.push(solicitante);
      } else {
        unicos.push(solicitante);
      }
    });

    // Construir string consolidado
    let resultado = '';

    repetidos.forEach((sol) => {
      resultado += ' / ' + sol;
    });

    unicos.forEach((sol) => {
      resultado += ' / ' + sol;
    });

    return resultado;
  }
}

