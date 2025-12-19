import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('OPFISCRESULTADO', { schema: 'FISCALIZACIONES' })
export class OpFiscResultado {
  @PrimaryColumn({ name: 'CODIGO', type: 'varchar2', length: 10 })
  codigo: string;

  @Column({ name: 'DESCRIPCION', type: 'varchar2', length: 255 })
  descripcion: string;

  @Column({ name: 'CODIGOOPFISCTIPOFISCALIZA', type: 'varchar2', length: 10 })
  codigoOpFiscTipoFiscaliza: string;

  @Column({ name: 'LIBERAOPADUANERA', type: 'varchar2', length: 1 })
  liberaOpAduanera: string;

  @Column({ name: 'LIBERAOPTRANSPORTE', type: 'varchar2', length: 1 })
  liberaOpTransporte: string;

  @Column({ name: 'ACTIVA', type: 'varchar2', length: 1 })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'timestamp' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'timestamp', nullable: true })
  fechaDesactiva: Date | null;
}
