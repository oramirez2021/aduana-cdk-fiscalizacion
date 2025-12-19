import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

/**
 * DTO de request para eliminar un registro de fiscalización
 * El ID del registro viene como path parameter
 */
export class EliminarRegistroRequestDto {
  @ApiProperty({
    description:
      'ID del registro de fiscalización a eliminar (soft delete). Corresponde a OpFiscRegistroFiscalizaci.Id',
    example: 123456,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del registro es requerido' })
  @Min(1, { message: 'El ID del registro debe ser mayor a 0' })
  idRegistro: number;
}


