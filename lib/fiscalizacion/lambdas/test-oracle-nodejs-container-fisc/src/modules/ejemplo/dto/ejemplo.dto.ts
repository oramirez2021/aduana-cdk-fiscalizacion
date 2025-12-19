import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO de Ejemplo
 * 
 * Este DTO muestra cómo definir validaciones y documentación Swagger
 * para los endpoints.
 */
export class CrearEjemploDto {
  @ApiProperty({
    description: 'Nombre del ejemplo',
    example: 'Ejemplo 1',
    minLength: 1,
    maxLength: 200
  })
  @IsString()
  @Length(1, 200)
  nombre: string;

  @ApiProperty({
    description: 'Descripción opcional',
    example: 'Esta es una descripción de ejemplo',
    required: false
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class EjemploResponseDto {
  @ApiProperty({ description: 'ID del ejemplo' })
  id: number;

  @ApiProperty({ description: 'Nombre del ejemplo' })
  nombre: string;

  @ApiProperty({ description: 'Descripción del ejemplo', required: false })
  descripcion?: string;

  @ApiProperty({ description: 'Estado activo (S/N)' })
  activo: string;

  @ApiProperty({ description: 'Fecha de creación' })
  fechaCreacion: Date;
}

