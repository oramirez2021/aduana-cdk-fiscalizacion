import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO que representa un resultado aplicado en el registro
 */
export class ResultadoAplicadoDto {
  @ApiProperty({
    description: 'Código del resultado',
    example: 'CERTIF_PRESENTADO',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción del resultado',
    example: 'CERTIFICADO PRESENTADO',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Observación registrada',
    example: 'Documentación correcta y completa',
    nullable: true,
  })
  observacion: string | null;
}

/**
 * DTO que representa un registro de fiscalización creado
 */
export class RegistroFiscalizacionCreadoDto {
  @ApiProperty({
    description: 'ID del registro de fiscalización creado',
    example: 123456,
  })
  id: number;

  @ApiProperty({
    description: 'ID de la acción de fiscalización',
    example: 789,
  })
  idAccionFiscalizacion: number;

  @ApiProperty({
    description: 'Número del documento asociado',
    example: '1930729638',
  })
  numeroDocAsociado: string;

  @ApiProperty({
    description: 'Código del tipo de documento',
    example: 'GTIME',
  })
  codigoTipoDocumento: string;

  @ApiProperty({
    description: 'Fecha de ejecución del registro',
    example: '2025-11-14T10:30:00.000Z',
  })
  fechaEjecucion: Date;

  @ApiProperty({
    description: 'Fecha de registro en el sistema',
    example: '2025-11-14T10:30:00.000Z',
  })
  fechaRegistroSistema: Date;

  @ApiProperty({
    description: 'Indica si retiene operación aduanera',
    example: 'S',
  })
  opAduaneraRetenida: string;

  @ApiProperty({
    description: 'Indica si retiene operación de transporte',
    example: 'N',
  })
  opTransporteRetenida: string;

  @ApiProperty({
    description: 'Estado del documento después del registro',
    example: 'VIS',
  })
  estadoDocumento: string;

  @ApiProperty({
    description: 'Código de denuncia si fue registrado',
    example: '',
    nullable: true,
  })
  codigoDenuncia: string | null;

  @ApiProperty({
    description: 'Array de resultados aplicados al registro',
    type: [ResultadoAplicadoDto],
  })
  resultados: ResultadoAplicadoDto[];
}

/**
 * DTO de response para la aplicación de registro de fiscalización
 */
export class AplicarRegistroResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Registros de fiscalización aplicados exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'Cantidad de registros creados',
    example: 1,
  })
  registrosCreados: number;

  @ApiProperty({
    description: 'Array con los detalles de cada registro creado',
    type: [RegistroFiscalizacionCreadoDto],
  })
  registros: RegistroFiscalizacionCreadoDto[];
}

