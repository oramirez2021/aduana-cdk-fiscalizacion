import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entity para tabla FISCALIZACIONES.OPFISCMARCA
 * Representa la relación entre documentos y operaciones de fiscalización
 */
@Entity({ schema: 'FISCALIZACIONES', name: 'OPFISCMARCA' })
export class OpFiscMarca {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'IDDOCUMENTO', type: 'number' })
  idDocumento: number;

  @Column({ name: 'IDOPFISCOPERACION', type: 'number' })
  idOpFiscOperacion: number;

  @Column({ name: 'ACTIVA', type: 'char', length: 1, default: 'S' })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'date', nullable: true })
  fechaActiva: Date;
}














