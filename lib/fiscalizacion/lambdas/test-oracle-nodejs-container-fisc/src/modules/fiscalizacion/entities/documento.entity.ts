import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entity para tabla DOCUMENTOS.DOCDOCUMENTOBASE
 * Representa las guías/documentos del sistema
 */
@Entity({ schema: 'DOCUMENTOS', name: 'DOCDOCUMENTOBASE' })
export class Documento {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'NUMERODOC', type: 'varchar2', length: 50 })
  numeroDoc: string;

  @Column({ name: 'CODIGOTIPODOCUMENTO', type: 'varchar2', length: 10 })
  codigoTipoDocumento: string;

  @Column({ name: 'NOMBREEMISOR', type: 'varchar2', length: 200, nullable: true })
  nombreEmisor: string;

  @Column({ name: 'TOTALBULTOS', type: 'number', nullable: true })
  totalBultos: number;

  @Column({ name: 'TOTALPESO', type: 'number', nullable: true })
  totalPeso: number;

  @Column({ name: 'TOTALVALOR', type: 'number', nullable: true })
  totalValor: number;
}














