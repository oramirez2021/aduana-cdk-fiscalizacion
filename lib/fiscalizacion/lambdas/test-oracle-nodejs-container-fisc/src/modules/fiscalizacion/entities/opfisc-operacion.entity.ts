import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entity para tabla FISCALIZACIONES.OPFISCOPERACION
 * Representa operaciones de fiscalización
 */
@Entity({ schema: 'FISCALIZACIONES', name: 'OPFISCOPERACION' })
export class OpFiscOperacion {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'DESCRIPCION', type: 'varchar2', length: 500, nullable: true })
  descripcion: string;

  @Column({ name: 'FECHACREACION', type: 'date', nullable: true })
  fechaCreacion: Date;

  @Column({ name: 'ACTIVA', type: 'char', length: 1, default: 'S' })
  activa: string;
}














