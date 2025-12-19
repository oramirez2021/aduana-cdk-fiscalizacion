import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidad de Ejemplo - TypeORM
 * 
 * Esta entidad demuestra cómo mapear una tabla Oracle con TypeORM.
 * 
 * IMPORTANTE: Esta es solo una entidad de ejemplo para mostrar el patrón.
 * Las entidades reales del sistema se crearán cuando se implementen
 * los módulos específicos (fiscalización, catálogos, etc.).
 * 
 * Convenciones de nomenclatura Oracle:
 * - Nombres de tabla en MAYÚSCULAS
 * - Nombres de columna en MAYÚSCULAS con snake_case
 * - Especificar schema cuando sea necesario
 * 
 * @example
 * // Entidad real típica:
 * @Entity('OpFiscResultado', { schema: 'FISCALIZACIONES' })
 * export class OpFiscResultado {
 *   @PrimaryColumn({ name: 'Codigo', type: 'varchar2', length: 20 })
 *   codigo: string;
 *   
 *   @Column({ name: 'Descripcion', type: 'varchar2', length: 500 })
 *   descripcion: string;
 *   
 *   @Column({ name: 'Activa', type: 'char', length: 1, default: 'S' })
 *   activa: string;
 * }
 */
@Entity('EJEMPLO_TABLA', { schema: 'FISCALIZACIONES' })
export class EjemploEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'varchar2', length: 200 })
  nombre: string;

  @Column({ name: 'DESCRIPCION', type: 'varchar2', length: 500, nullable: true })
  descripcion: string;

  @Column({ name: 'ACTIVO', type: 'char', length: 1, default: 'S' })
  activo: string;

  @Column({ name: 'FECHA_CREACION', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaCreacion: Date;
}

