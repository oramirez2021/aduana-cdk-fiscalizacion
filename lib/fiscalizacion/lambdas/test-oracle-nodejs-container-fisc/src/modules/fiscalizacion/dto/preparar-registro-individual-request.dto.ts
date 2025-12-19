import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * DTO para solicitar la preparación de registro de fiscalización INDIVIDUAL
 * Este endpoint es específico para cuando se selecciona UNA SOLA guía
 * Incluye registros históricos (QRegistrosResultados)
 */
export class PrepararRegistroIndividualRequestDto {
  @ApiProperty({
    description: 'ID de la guía seleccionada',
    example: 18931116,
    type: Number,
    required: true,
  })
  @IsNumber({}, { message: 'idGuia debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la guía no puede estar vacío' })
  idGuia: number;
}





