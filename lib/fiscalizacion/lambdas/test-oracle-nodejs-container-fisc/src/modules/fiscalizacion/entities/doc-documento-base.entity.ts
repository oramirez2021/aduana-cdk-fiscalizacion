import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Entidad para DOCUMENTOS.DOCDOCUMENTOBASE
 * Contiene solo los campos que realmente existen en la base de datos Oracle 11g
 */
@Entity('DOCDOCUMENTOBASE', { schema: 'DOCUMENTOS' })
export class DocDocumentoBase {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'TIPODOCUMENTO', type: 'varchar2', length: 10, nullable: true })
  tipoDocumento: string | null;

  @Column({ name: 'VERSION', type: 'number', nullable: true })
  version: number | null;

  @Column({ name: 'NUMEROEXTERNO', type: 'varchar2', length: 200, nullable: true })
  numeroExterno: string | null;

  @Column({ name: 'LOGINCREADOR', type: 'varchar2', length: 50, nullable: true })
  loginCreador: string | null;

  @Column({ name: 'CREADOR', type: 'varchar2', length: 255, nullable: true })
  creador: string | null;

  @Column({ name: 'FECHACREACION', type: 'date', nullable: true })
  fechaCreacion: Date | null;

  @Column({ name: 'FECHAEMISION', type: 'date', nullable: true })
  fechaEmision: Date | null;

  @Column({ name: 'ACTIVO', type: 'varchar2', length: 1, nullable: true })
  activo: string | null;

  // Nota: CODIGOESTADOACTUAL no existe en la tabla base
  // El estado se maneja a través de otras tablas o procedimientos
}

