import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ArrayMinSize, IsNumber } from 'class-validator';

/**
 * DTO para solicitar la preparación de registro de fiscalización
 * Soporta tanto selección individual (1 guía) como múltiple (N guías)
 */
export class PrepararRegistroRequestDto {
  @ApiProperty({
    description: 'Array de IDs de guías seleccionadas (mínimo 1, sin límite máximo)',
    example: [123456, 123457, 123458],
    type: [Number],
    minItems: 1,
    isArray: true,
    required: true,
  })
  @IsArray({ message: 'guiasIds debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una guía' })
  @IsNumber({}, { each: true, message: 'Cada ID debe ser un número' })
  @IsNotEmpty({ message: 'Los IDs de guías no pueden estar vacíos' })
  guiasIds: number[];
}

