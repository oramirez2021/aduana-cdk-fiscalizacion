import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para la eliminación de un registro de fiscalización
 * Implementa soft delete (Activo='N', FechaDesactiva=NOW)
 */
export class EliminarRegistroResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Registro de fiscalización eliminado exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID del registro que fue eliminado',
    example: 123456,
  })
  idRegistroEliminado: number;

  @ApiProperty({
    description:
      'Fecha y hora en que se realizó la eliminación (marca de tiempo del soft delete)',
    example: '2025-11-26T10:30:45.123Z',
  })
  fechaEliminacion: Date;

  @ApiProperty({
    description:
      'ID de la acción de fiscalización a la que pertenecía el registro eliminado',
    example: 789,
  })
  idAccionFiscalizacion: number;

  @ApiProperty({
    description: 'Número del documento asociado al registro eliminado',
    example: '1930730558',
  })
  numeroDocAsociado: string;
}


