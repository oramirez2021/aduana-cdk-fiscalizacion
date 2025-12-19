import { ApiProperty } from '@nestjs/swagger';
import {
  GuiaInfoDto,
  TipoFiscalizacionDto,
  ResultadoDisponibleDto,
  DatosInicialesDto,
} from './preparar-registro-response.dto';

/**
 * DTO que representa la acción de fiscalización
 */
export class AccionFiscalizacionDto {
  @ApiProperty({
    description: 'ID de la acción de fiscalización',
    example: 789,
  })
  id: number;

  @ApiProperty({
    description: 'ID del solicitante de la fiscalización',
    example: 123,
    nullable: true,
  })
  idSolicitante: number | null;

  @ApiProperty({
    description: 'Nombre del solicitante de la fiscalización',
    example: 'ARAOS Y, MARCELO',
  })
  nombreSolicitante: string;

  @ApiProperty({
    description: 'Descripción de la acción',
    example: 'Revisión de documentación de importación',
    nullable: true,
  })
  descripcion: string | null;

  @ApiProperty({
    description: 'Fecha planificada de ejecución',
    example: '2025-11-14T00:00:00.000Z',
    nullable: true,
  })
  fechaPlanificada: Date | null;

  @ApiProperty({
    description: 'Fecha de ejecución',
    example: '2025-11-14T10:30:00.000Z',
    nullable: true,
  })
  fechaEjecucion: Date | null;
}

/**
 * DTO que representa un registro histórico de fiscalización
 * Equivalente a los datos de QRegistrosResultados() del monolito
 */
export class RegistroHistoricoDto {
  @ApiProperty({
    description: 'ID único del registro de fiscalización',
    example: 123456,
  })
  idRegistro: number;

  @ApiProperty({
    description: 'Fecha de ejecución del registro (formato DD/MM/YYYY)',
    example: '17/11/2025',
  })
  fechaEjecucion: string;

  @ApiProperty({
    description: 'Fecha y hora de registro en el sistema (formato DD/MM/YYYY HH24:MI:SS)',
    example: '17/11/2025 10:30:45',
  })
  fechaSysRegistro: string;

  @ApiProperty({
    description: 'Resultados concatenados del registro',
    example: 'CERTIFICADO PRESENTADO, CONFORME',
  })
  resultados: string;

  @ApiProperty({
    description: 'Observaciones concatenadas del registro',
    example: 'Documentación correcta y completa',
  })
  observaciones: string;
}

/**
 * DTO de respuesta para preparar registro individual de fiscalización
 * Incluye toda la información necesaria para la pantalla de registro individual
 * Equivale a la combinación de:
 * - MDetalleDocumento2.jsp (sesión)
 * - SEjecucionAccionCourier.jsp (carga de acción)
 * - SeleccionRegistroFiscalizacionCourier.jsp (registros históricos)
 */
export class PrepararRegistroIndividualResponseDto {
  @ApiProperty({
    description: 'Información de la guía seleccionada',
    type: GuiaInfoDto,
  })
  guia: GuiaInfoDto;

  @ApiProperty({
    description: 'Información de la acción de fiscalización activa (null si no existe)',
    type: AccionFiscalizacionDto,
    nullable: true,
  })
  accionFiscalizacion: AccionFiscalizacionDto | null;

  @ApiProperty({
    description: 'Tipo de fiscalización de la acción (null si no existe acción)',
    type: TipoFiscalizacionDto,
    nullable: true,
  })
  tipoFiscalizacion: TipoFiscalizacionDto | null;

  @ApiProperty({
    description: 'Solicitante de la fiscalización (null si no existe acción)',
    example: ' / ARAOS Y, MARCELO',
    nullable: true,
  })
  solicitante: string | null;

  @ApiProperty({
    description: 'Resultados disponibles para este tipo de fiscalización',
    type: [ResultadoDisponibleDto],
  })
  resultadosDisponibles: ResultadoDisponibleDto[];

  @ApiProperty({
    description: 'Registros históricos de fiscalización para esta acción (QRegistrosResultados)',
    type: [RegistroHistoricoDto],
    example: [
      {
        fechaEjecucion: '14/11/2025',
        fechaSysRegistro: '14/11/2025 10:30:45',
        resultados: 'CERTIFICADO PRESENTADO',
        observaciones: 'Documentación correcta',
      },
      {
        fechaEjecucion: '13/11/2025',
        fechaSysRegistro: '13/11/2025 15:20:30',
        resultados: 'CONFORME',
        observaciones: 'Primera revisión conforme',
      },
    ],
  })
  registrosHistoricos: RegistroHistoricoDto[];

  @ApiProperty({
    description: 'Datos iniciales para el formulario de registro',
    type: DatosInicialesDto,
  })
  datosIniciales: DatosInicialesDto;
}

