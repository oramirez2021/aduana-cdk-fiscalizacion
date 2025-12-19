import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO que representa la información básica de la guía
 */
export class GuiaInfoDto {
  @ApiProperty({
    description: 'ID del documento',
    example: 18931116,
  })
  id: number;

  @ApiProperty({
    description: 'Número del documento',
    example: '1930730558',
  })
  numeroDocumento: string;

  @ApiProperty({
    description: 'Código del tipo de documento',
    example: 'GTIME',
    required: false,
  })
  codigoTipoDocumento?: string;
}

/**
 * DTO que representa un tipo de fiscalización
 */
export class TipoFiscalizacionDto {
  @ApiProperty({
    description: 'Código del tipo de fiscalización',
    example: 'DOCTIME',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre del tipo de fiscalización',
    example: 'DOCUMENTACION COURIER',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción del tipo de fiscalización',
    example: 'Fiscalización de documentación de courier',
    nullable: true,
    required: false,
  })
  descripcion?: string | null;
}

/**
 * DTO que representa un resultado disponible
 */
export class ResultadoDisponibleDto {
  @ApiProperty({
    description: 'Código del resultado',
    example: 'CERTIF. PRESENTADO',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción del resultado',
    example: 'CERTIFICADO PRESENTADO',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Indica si libera la operación aduanera',
    example: 'S',
  })
  liberaOpAduanera: string;

  @ApiProperty({
    description: 'Indica si libera la operación de transporte',
    example: 'S',
  })
  liberaOpTransporte: string;
}

/**
 * DTO que representa los datos iniciales del formulario
 */
export class DatosInicialesDto {
  @ApiProperty({
    description: 'Número de denuncia inicial (vacío por defecto)',
    example: '',
  })
  numeroDenuncia: string;

  @ApiProperty({
    description: 'Indica si la operación aduanera está retenida (N por defecto)',
    example: 'N',
  })
  opAduaneraRetenida: string;

  @ApiProperty({
    description: 'Indica si la operación de transporte está retenida (N por defecto)',
    example: 'N',
  })
  opTransporteRetenida: string;
}

/**
 * DTO de respuesta para preparar registro de fiscalización (múltiple)
 */
export class PrepararRegistroResponseDto {
  @ApiProperty({
    description: 'Array de guías seleccionadas',
    type: [GuiaInfoDto],
  })
  guias: GuiaInfoDto[];

  @ApiProperty({
    description: 'Tipo de fiscalización común a todas las guías',
    type: TipoFiscalizacionDto,
  })
  tipoFiscalizacion: TipoFiscalizacionDto;

  @ApiProperty({
    description: 'Solicitantes consolidados',
    example: ' / ARAOS Y, MARCELO / GONZALEZ P, JUAN',
  })
  solicitantes: string;

  @ApiProperty({
    description: 'Resultados disponibles para este tipo de fiscalización',
    type: [ResultadoDisponibleDto],
  })
  resultadosDisponibles: ResultadoDisponibleDto[];

  @ApiProperty({
    description: 'Datos iniciales para el formulario de registro',
    type: DatosInicialesDto,
  })
  datosIniciales: DatosInicialesDto;
}
