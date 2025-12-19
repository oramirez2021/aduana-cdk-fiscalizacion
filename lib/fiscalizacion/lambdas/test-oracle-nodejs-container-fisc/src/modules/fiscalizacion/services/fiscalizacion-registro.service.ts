import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseOracleService } from '../../../shared/base-oracle.service';
import { ConfigService } from '@nestjs/config';
import {
  AplicarRegistroRequestDto,
  AplicarRegistroResponseDto,
  RegistroFiscalizacionCreadoDto,
  ResultadoAplicadoDto,
  EliminarRegistroResponseDto,
} from '../dto';
import {
  DocDocumentoBase,
  OpFiscResultado,
  OpFiscRegistroFiscalizacion,
  OpFiscResultadoAccion,
  OpFiscAccionFiscalizacion,
} from '../entities';

/**
 * Servicio para aplicar registros de fiscalización
 * Implementa la lógica del botón "Aceptar" del monolito
 * Usa arquitectura mixta: TypeORM para CRUD simple, SQL directo para queries complejas
 */
@Injectable()
export class FiscalizacionRegistroService extends BaseOracleService {
  protected readonly logger = new Logger(FiscalizacionRegistroService.name);

  constructor(
    protected readonly configService: ConfigService,
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
    @InjectRepository(OpFiscResultado)
    private readonly opFiscResultadoRepository: Repository<OpFiscResultado>,
    @InjectRepository(OpFiscRegistroFiscalizacion)
    private readonly opFiscRegistroFiscalizacionRepository: Repository<OpFiscRegistroFiscalizacion>,
    @InjectRepository(OpFiscResultadoAccion)
    private readonly opFiscResultadoAccionRepository: Repository<OpFiscResultadoAccion>,
    @InjectRepository(OpFiscAccionFiscalizacion)
    private readonly opFiscAccionFiscalizacionRepository: Repository<OpFiscAccionFiscalizacion>,
  ) {
    super(configService);
  }

  /**
   * Aplica registro de fiscalización para una o más guías
   * Implementa el flujo completo del método addRegistroFiscalizacion del monolito
   *
   * Líneas 516-602: RegistroFiscalizacionCourier1.jsp
   * Líneas 1281-1429: OpFiscAccionFiscalizacion.java
   */
  async aplicarRegistro(
    dto: AplicarRegistroRequestDto,
  ): Promise<AplicarRegistroResponseDto> {
    this.logger.log(
      `Aplicando registro para ${dto.documentos.length} documento(s)`,
    );

    // Validación: debe haber al menos un resultado
    if (!dto.resultadosIngresados || dto.resultadosIngresados.length === 0) {
      throw new BadRequestException(
        'Debe ingresar al menos un resultado en el registro',
      );
    }

    const registrosCreados: RegistroFiscalizacionCreadoDto[] = [];

    // Obtener ID del ejecutante y nombre del DTO (enviado por el frontend)
    const idEjecutante = dto.idEjecutante;
    const nombreEjecutante = dto.nombreEjecutante;

    // Obtener timestamp actual
    const fechaActual = new Date();

    // Iterar sobre cada documento (línea 535 del JSP)
    for (const documento of dto.documentos) {
      try {
        // 1. Obtener acción de fiscalización para este documento
        const accion = await this.obtenerAccionFiscalizacionPorDocumento(
          documento.id,
        );

        if (!accion) {
          this.logger.warn(
            `No se encontró acción de fiscalización para documento ${documento.id}`,
          );
          continue;
        }

        // 2. Crear registro de fiscalización principal
        const registroId = await this.crearRegistroFiscalizacion({
          idAccionFiscalizacion: accion.idAccionFiscalizacion,
          numeroDocAsociado: documento.numeroDocumento,
          codigoTipoDocumento: documento.codigoTipoDocumento,
          idDocumentoAsociado: documento.id,
          fechaEjecucion: fechaActual,
          opAduaneraRetenida: dto.opAduaneraRetenida ? 'S' : 'N',
          opTransporteRetenida: dto.opTransporteRetenida ? 'S' : 'N',
          idEjecutante,
          nombreEjecutante,
          codigoDenuncia: dto.codigoDenuncia || null,
          fechaActiva: fechaActual,
        });

        // 3. Crear resultados asociados al registro
        const resultadosAplicados: ResultadoAplicadoDto[] = [];
        for (const resultado of dto.resultadosIngresados) {
          await this.crearResultadoAccion({
            idRegistroFiscalizacion: registroId,
            idAccionFiscalizacion: accion.idAccionFiscalizacion,
            codigoResultado: resultado.codigoResultado,
            observacion: resultado.observacion || null,
            fechaActivo: fechaActual,
          });

          // Obtener descripción del resultado
          const resultadoInfo = await this.obtenerInfoResultado(
            resultado.codigoResultado,
          );

          resultadosAplicados.push({
            codigo: resultado.codigoResultado,
            descripcion: resultadoInfo?.descripcion || resultado.codigoResultado,
            observacion: resultado.observacion || null,
          });
        }

        // 4. Cambiar estado del documento a "VIS" (VISADO) si es GTIME
        /*if (documento.codigoTipoDocumento === 'GTIME') {
          await this.cambiarEstadoDocumento(
            documento.id,
            'VIS',
            nombreEjecutante,
          );
        }*/

        // 5. Actualizar retenciones de la acción de fiscalización
        await this.actualizarRetencionesAccion(
          accion.idAccionFiscalizacion,
          dto.opAduaneraRetenida ? 'S' : 'N',
          dto.opTransporteRetenida ? 'S' : 'N',
        );

        // Agregar a resultados
        registrosCreados.push({
          id: registroId,
          idAccionFiscalizacion: accion.idAccionFiscalizacion,
          numeroDocAsociado: documento.numeroDocumento,
          codigoTipoDocumento: documento.codigoTipoDocumento,
          fechaEjecucion: fechaActual,
          fechaRegistroSistema: fechaActual,
          opAduaneraRetenida: dto.opAduaneraRetenida ? 'S' : 'N',
          opTransporteRetenida: dto.opTransporteRetenida ? 'S' : 'N',
          estadoDocumento: 'VIS',
          codigoDenuncia: dto.codigoDenuncia || null,
          resultados: resultadosAplicados,
        });

        this.logger.log(
          `Registro creado exitosamente para documento ${documento.numeroDocumento}`,
        );
      } catch (error) {
        this.logger.error(
          `Error procesando documento ${documento.numeroDocumento}: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Error procesando documento ${documento.numeroDocumento}: ${error.message}`,
        );
      }
    }

    return {
      success: true,
      message: 'Registros de fiscalización aplicados exitosamente',
      registrosCreados: registrosCreados.length,
      registros: registrosCreados,
    };
  }

  /**
   * Obtiene acción de fiscalización activa para un documento
   * Query equivalente a OpFiscAdministradorOperacion.QAccionesFiscalizacionPorDocumento
   * con ConResultados="N" (sin cargar resultados existentes)
   * 
   * Monolito: OpFiscAdministradorOperacion.java líneas 1207-1222
   */
  private async obtenerAccionFiscalizacionPorDocumento(
    idDocumento: number,
  ): Promise<{
    idAccionFiscalizacion: number;
    idSolicitante: number | null;
    nombreSolicitante: string;
    descripcion: string | null;
    fechaPlanificada: Date | null;
    fechaEjecucion: Date | null;
    tipoFiscalizacionCodigo: string;
    tipoFiscalizacionNombre: string;
    tipoFiscalizacionDescripcion: string | null;
  } | null> {
    // Query original del monolito con bind parameter para prevenir SQL injection
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

    // Uso de bind parameter (:1) para prevenir SQL injection
    const result = await this.executeQuery<{
      ID: number;
      OPFISCACCIONF_FECHAPLANIFICADA: Date | null;
      OPFISCACCIONF_FECHA_EJECUCION: Date | null;
      OPFISCACCIONF_IDSOLICITANTE: number | null;
      OPFISCACCIONF_NOMBRESOLICITANTE: string;
      OPFISCACCIONF_DESCRIPCION: string | null;
      TIPO_CODIGO: string;
      TIPO_NOMBRE: string;
      TIPO_DESCRIPCION: string | null;
    }>(sql, [idDocumento]);

    if (!result || result.length === 0) {
      return null;
    }

    return {
      idAccionFiscalizacion: result[0].ID,
      fechaPlanificada: result[0].OPFISCACCIONF_FECHAPLANIFICADA,
      fechaEjecucion: result[0].OPFISCACCIONF_FECHA_EJECUCION,
      idSolicitante: result[0].OPFISCACCIONF_IDSOLICITANTE,
      nombreSolicitante: result[0].OPFISCACCIONF_NOMBRESOLICITANTE,
      descripcion: result[0].OPFISCACCIONF_DESCRIPCION,
      tipoFiscalizacionCodigo: result[0].TIPO_CODIGO,
      tipoFiscalizacionNombre: result[0].TIPO_NOMBRE,
      tipoFiscalizacionDescripcion: result[0].TIPO_DESCRIPCION,
    };
  }

  /**
   * Crea un registro de fiscalización
   * Equivalente a OpFiscRegistroFiscalizacion.Create() (línea 1348)
   * Migrado a TypeORM - INSERT simple (nextId se mantiene en SQL)
   */
  private async crearRegistroFiscalizacion(data: {
    idAccionFiscalizacion: number;
    numeroDocAsociado: string;
    codigoTipoDocumento: string;
    idDocumentoAsociado: number;
    fechaEjecucion: Date;
    opAduaneraRetenida: string;
    opTransporteRetenida: string;
    idEjecutante: number;
    nombreEjecutante: string;
    codigoDenuncia: string | null;
    fechaActiva: Date;
  }): Promise<number> {
    // Obtener próximo ID (se mantiene en SQL por ser MAX+1 específico)
    const nextIdSql = `
      SELECT NVL(MAX(ID), 0) + 1 AS next_id
      FROM FISCALIZACIONES.OPFISCREGISTROFISCALIZACI
      WHERE IDOPFISCACCIONFISCALIZACI = :idAccionFiscalizacion
    `;

    const nextIdResult = await this.executeQuery<any>(nextIdSql, {
      idAccionFiscalizacion: data.idAccionFiscalizacion,
    });

    const nextId = nextIdResult[0].NEXT_ID;

    // Fecha nula para desactivación (31/12/9999)
    const fechaNula = new Date('9999-12-31');

    // Crear instancia de la entity
    const registro = this.opFiscRegistroFiscalizacionRepository.create({
      id: nextId,
      idOpFiscAccionFiscalizaci: data.idAccionFiscalizacion,
      numeroDocAsociado: data.numeroDocAsociado,
      codigoTipoDocumento: data.codigoTipoDocumento,
      idDocumentoAsociado: data.idDocumentoAsociado,
      identificacionVehiculo: ' ', // Espacio en blanco (Oracle no permite cadena vacía en campos NOT NULL)
      fechaEjecucion: data.fechaEjecucion,
      opAduaneraRetenida: data.opAduaneraRetenida,
      opTransporteRetenida: data.opTransporteRetenida,
      idEjecutante: data.idEjecutante,
      nombreEjecutante: data.nombreEjecutante,
      activo: 'S',
      fechaActiva: data.fechaActiva,
      fechaDesactiva: fechaNula,
      fechaModificacion: data.fechaActiva,
      codigoDenuncia: data.codigoDenuncia,
      totalBultos: null,
    });

    // Guardar en base de datos
    await this.opFiscRegistroFiscalizacionRepository.save(registro);

    return nextId;
  }

  /**
   * Crea un resultado asociado a un registro
   * Equivalente a OpFiscResultadoAccion.Create() (línea 1368)
   * Migrado a TypeORM - INSERT con ID manual desde secuencia
   */
  private async crearResultadoAccion(data: {
    idRegistroFiscalizacion: number;
    idAccionFiscalizacion: number;
    codigoResultado: string;
    observacion: string | null;
    fechaActivo: Date;
  }): Promise<void> {
    // Obtener próximo ID de la secuencia (línea 112-115 del monolito)
    const nextIdSql = `SELECT SEC_OpFiscResultadoAccion.nextval AS next_id FROM dual`;
    const nextIdResult = await this.executeQuery<{ NEXT_ID: number }>(nextIdSql);
    const nextId = nextIdResult[0].NEXT_ID;

    // Limitar observación a 255 caracteres
    let observacion = data.observacion;
    if (observacion && observacion.length > 255) {
      observacion = observacion.substring(0, 255);
    }

    const fechaNula = new Date('9999-12-31');

    // Crear instancia de la entity
    const resultado = this.opFiscResultadoAccionRepository.create({
      id: nextId, // ID obtenido de la secuencia
      idOpFiscRegistroFiscaliza: data.idRegistroFiscalizacion,
      idOpFiscAccionFiscalizaci: data.idAccionFiscalizacion,
      codigoOpFiscResultado: data.codigoResultado,
      observacion: observacion,
      activo: 'S',
      fechaActivo: data.fechaActivo,
      fechaDesactivo: fechaNula,
    });

    // Guardar en base de datos
    await this.opFiscResultadoAccionRepository.save(resultado);
  }

  /**
   * Obtiene información de un resultado
   * Migrado a SQL directo por incompatibilidad Oracle 11g con TypeORM findOne
   */
  private async obtenerInfoResultado(
    codigoResultado: string,
  ): Promise<{ descripcion: string } | null> {
    // Query directo con bind parameter para prevenir SQL injection
    const sql = `
      SELECT descripcion
      FROM FISCALIZACIONES.OPFISCRESULTADO
      WHERE codigo = :1
        AND activa = 'S'
        AND ROWNUM <= 1
    `;

    // Uso de bind parameter (:1) para prevenir SQL injection
    const result = await this.executeQuery<{ DESCRIPCION: string }>(sql, [
      codigoResultado,
    ]);

    if (!result || result.length === 0) {
      return null;
    }

    return {
      descripcion: result[0].DESCRIPCION,
    };
  }

  /**
   * Cambia el estado de un documento a VISADO
   * Equivalente a setEstadoManifiesto (línea 1409)
   * Migrado a TypeORM - UPDATE simple
   */
  /*private async cambiarEstadoDocumento(
    idDocumento: number,
    nuevoEstado: string,
    usuario: string,
  ): Promise<void> {
    await this.documentoBaseRepository.update(
      { id: idDocumento },
      {
        codigoEstadoActual: nuevoEstado,
        usuarioUltMod: usuario,
        fechaUltMod: new Date(), // Equivalente a SYSDATE
      },
    );

    this.logger.log(
      `Estado del documento ${idDocumento} actualizado a ${nuevoEstado}`,
    );
  }*/

  /**
   * Actualiza las retenciones de una acción de fiscalización
   * Equivalente a línea 1426
   * Migrado a TypeORM - UPDATE simple
   */
  private async actualizarRetencionesAccion(
    idAccionFiscalizacion: number,
    opAduaneraRetenida: string,
    opTransporteRetenida: string,
  ): Promise<void> {
    await this.opFiscAccionFiscalizacionRepository.update(
      { id: idAccionFiscalizacion },
      {
        opAduaneraRetenida: opAduaneraRetenida,
        opTransporteRetenida: opTransporteRetenida,
      },
    );

    this.logger.log(
      `Retenciones actualizadas para acción ${idAccionFiscalizacion}`,
    );
  }

  /**
   * Busca un registro de fiscalización activo usando PRIMARY KEY compuesta
   * Query directo Oracle 11g compatible (evita problemas de dialecto TypeORM)
   *
   * Equivalente al Load() del monolito (OpFiscRegistroFiscalizacion.java líneas 286-287):
   * WHERE Id = X AND IdOpFiscAccionFiscalizaci = Y
   *
   * @param idRegistro ID del registro (parte 1 de la PK compuesta)
   * @param idAccionFiscalizacion ID de la acción de fiscalización (parte 2 de la PK compuesta)
   * @returns Información básica del registro o null si no existe/está inactivo
   */
  private async buscarRegistroActivo(
    idRegistro: number,
    idAccionFiscalizacion: number,
  ): Promise<{
    id: number;
    idAccionFiscalizacion: number;
    numeroDocAsociado: string;
  } | null> {
    const sql = `
      SELECT 
        ID,
        IDOPFISCACCIONFISCALIZACI,
        NUMERODOCASOCIADO
      FROM FISCALIZACIONES.OPFISCREGISTROFISCALIZACI
      WHERE ID = :1
        AND IDOPFISCACCIONFISCALIZACI = :2
        AND ACTIVO = 'S'
        AND ROWNUM <= 1
    `;

    const result = await this.executeQuery<{
      ID: number;
      IDOPFISCACCIONFISCALIZACI: number;
      NUMERODOCASOCIADO: string;
    }>(sql, [idRegistro, idAccionFiscalizacion]);

    if (!result || result.length === 0) {
      return null;
    }

    return {
      id: result[0].ID,
      idAccionFiscalizacion: result[0].IDOPFISCACCIONFISCALIZACI,
      numeroDocAsociado: result[0].NUMERODOCASOCIADO,
    };
  }

  /**
   * Elimina lógicamente un registro de fiscalización (soft delete)
   * Implementa el flujo del botón "Eliminar" del monolito
   *
   * Monolito:
   * - SeleccionRegistroFiscalizacionCourier.jsp líneas 200-202 (setOid con ambos IDs), 293-305 (delete)
   * - OpFiscRegistroFiscalizacion.java líneas 286-287 (Load con PRIMARY KEY compuesta), 703-709 (delete)
   * - OpFiscAccionFiscalizacion.java líneas 1045-1048 (Oid compuesto: Id + IdOpFiscAccionFiscalizaci)
   *
   * PRIMARY KEY compuesta: (Id, IdOpFiscAccionFiscalizaci)
   *
   * @param idRegistro ID del registro (parte 1 de la PK compuesta)
   * @param idAccionFiscalizacion ID de la acción de fiscalización (parte 2 de la PK compuesta)
   * @returns Información del registro eliminado
   * @throws NotFoundException Si el registro no existe o ya está eliminado
   * @throws InternalServerErrorException Si hay un error en la base de datos
   */
  async eliminarRegistro(
    idRegistro: number,
    idAccionFiscalizacion: number,
  ): Promise<EliminarRegistroResponseDto> {
    this.logger.log(
      `🗑️  Iniciando eliminación de registro ${idRegistro} (acción ${idAccionFiscalizacion})`,
    );

    try {
      // 1. Buscar el registro activo con PRIMARY KEY compuesta (SQL directo - compatible Oracle 11g)
      const registro = await this.buscarRegistroActivo(
        idRegistro,
        idAccionFiscalizacion,
      );

      // 2. Validar que existe
      if (!registro) {
        this.logger.warn(
          `Registro ${idRegistro} (acción ${idAccionFiscalizacion}) no encontrado o ya está eliminado`,
        );
        throw new NotFoundException(
          `El registro de fiscalización con ID ${idRegistro} y acción ${idAccionFiscalizacion} no existe o ya fue eliminado`,
        );
      }

      // 3. Realizar soft delete con TypeORM update() usando PRIMARY KEY compuesta (simple y compatible)
      const fechaEliminacion = new Date();

      const updateResult =
        await this.opFiscRegistroFiscalizacionRepository.update(
          {
            id: idRegistro,
            idOpFiscAccionFiscalizaci: idAccionFiscalizacion,
            activo: 'S',
          }, // WHERE con PRIMARY KEY compuesta
          {
            activo: 'N',
            fechaDesactiva: fechaEliminacion,
          },
        );

      // 4. Verificar que se actualizó
      if (updateResult.affected === 0) {
        throw new NotFoundException(
          `No se pudo eliminar el registro ${idRegistro} (acción ${idAccionFiscalizacion}). Puede que ya esté eliminado.`,
        );
      }

      this.logger.log(
        `✅ Registro ${idRegistro} (acción ${idAccionFiscalizacion}) eliminado exitosamente (soft delete)`,
      );

      // 5. Retornar respuesta con información del registro eliminado
      return {
        success: true,
        message: 'Registro de fiscalización eliminado exitosamente',
        idRegistroEliminado: idRegistro,
        fechaEliminacion: fechaEliminacion,
        idAccionFiscalizacion: registro.idAccionFiscalizacion,
        numeroDocAsociado: registro.numeroDocAsociado,
      };
    } catch (error) {
      // Si es NotFoundException, la propagamos tal cual
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Para cualquier otro error, lo envolvemos en InternalServerErrorException
      this.logger.error(
        `Error eliminando registro ${idRegistro} (acción ${idAccionFiscalizacion}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al eliminar el registro de fiscalización: ${error.message}`,
      );
    }
  }
}

