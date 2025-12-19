import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * DTO que representa un documento/guía a registrar
 */
export class DocumentoRegistroDto {
  @ApiProperty({
    description: 'ID del documento',
    example: 18931116,
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Número del documento/guía',
    example: '1930730558',
  })
  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @ApiProperty({
    description: 'Código del tipo de documento',
    example: 'GTIME',
    default: 'GTIME',
  })
  @IsString()
  @IsNotEmpty()
  codigoTipoDocumento: string;
}

/**
 * DTO que representa un resultado de fiscalización a aplicar
 */
export class ResultadoFiscalizacionDto {
  @ApiProperty({
    description: 'Código del resultado de fiscalización',
    example: 'CERTIF. PRESENTADO',
  })
  @IsString()
  @IsNotEmpty()
  codigoResultado: string;

  @ApiProperty({
    description: 'Observación del resultado (máximo 255 caracteres)',
    example: 'Documentación correcta y completa',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  observacion?: string;
}

/**
 * DTO de request para aplicar registro de fiscalización
 * Soporta una o múltiples guías con los mismos resultados/configuración
 */
export class AplicarRegistroRequestDto {
  @ApiProperty({
    description:
      'Array de documentos/guías a registrar. Los mismos resultados y configuración se aplican a todos',
    type: [DocumentoRegistroDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentoRegistroDto)
  @IsNotEmpty()
  documentos: DocumentoRegistroDto[];

  @ApiProperty({
    description:
      'Array de resultados de fiscalización a aplicar. Se aplican los mismos a todas las guías',
    type: [ResultadoFiscalizacionDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultadoFiscalizacionDto)
  @IsNotEmpty()
  resultadosIngresados: ResultadoFiscalizacionDto[];

  @ApiProperty({
    description:
      'Código de denuncia (opcional). Se aplica el mismo a todas las guías',
    example: '557411',
    required: false,
  })
  @IsString()
  @IsOptional()
  codigoDenuncia?: string;

  @ApiProperty({
    description:
      'ID de la persona ejecutante (usuario logueado). ID de la tabla PERSONAS',
    example: 8981,
  })
  @IsNumber()
  @IsNotEmpty()
  idEjecutante: number;

  @ApiProperty({
    description:
      'Nombre del ejecutante (nombre completo del usuario logueado)',
    example: 'YERKO MENDEZ',
  })
  @IsString()
  @IsNotEmpty()
  nombreEjecutante: string;

  @ApiProperty({
    description:
      'Indica si retiene la operación aduanera. Se aplica el mismo valor a todas las guías',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  opAduaneraRetenida?: boolean;

  @ApiProperty({
    description:
      'Indica si retiene la operación de transporte. Se aplica el mismo valor a todas las guías',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  opTransporteRetenida?: boolean;
}

