import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entity para tabla FISCALIZACIONES.OPFISCTIPOFISCALIZACION
 * Representa tipos de fiscalización (ej: COURIER)
 */
@Entity({ schema: 'FISCALIZACIONES', name: 'OPFISCTIPOFISCALIZACION' })
export class OpFiscTipoFiscalizacion {
  @PrimaryColumn({ name: 'CODIGO', type: 'varchar2', length: 10 })
  codigo: string;

  @Column({ name: 'NOMBRE', type: 'varchar2', length: 100 })
  nombre: string;

  @Column({ name: 'DESCRIPCION', type: 'varchar2', length: 500, nullable: true })
  descripcion: string;

  @Column({ name: 'ACTIVA', type: 'char', length: 1, default: 'S' })
  activa: string;
}














