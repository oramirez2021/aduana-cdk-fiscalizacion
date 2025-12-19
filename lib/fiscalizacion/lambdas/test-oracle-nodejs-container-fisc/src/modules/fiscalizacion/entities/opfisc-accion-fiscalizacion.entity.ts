import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('OPFISCACCIONFISCALIZACION', { schema: 'FISCALIZACIONES' })
export class OpFiscAccionFiscalizacion {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @Column({ name: 'IDOPFISCOPERACION', type: 'number' })
  idOpFiscOperacion: number;

  @Column({ name: 'CODIGOOPFISCTIPOFISCALIZA', type: 'varchar2', length: 10 })
  codigoOpFiscTipoFiscaliza: string;

  @Column({ name: 'FECHAPLANIFICADA', type: 'timestamp', nullable: true })
  fechaPlanificada: Date | null;

  @Column({ name: 'FECHAEJECUCION', type: 'timestamp', nullable: true })
  fechaEjecucion: Date | null;

  @Column({ name: 'IDSOLICITANTE', type: 'number', nullable: true })
  idSolicitante: number | null;

  @Column({ name: 'NOMBRESOLICITANTE', type: 'varchar2', length: 100, nullable: true })
  nombreSolicitante: string | null;

  @Column({ name: 'DESCRIPCION', type: 'varchar2', length: 255, nullable: true })
  descripcion: string | null;

  @Column({ name: 'OPADUANERARETENIDA', type: 'varchar2', length: 1 })
  opAduaneraRetenida: string;

  @Column({ name: 'OPTRANSPORTERETENIDA', type: 'varchar2', length: 1 })
  opTransporteRetenida: string;

  @Column({ name: 'ACTIVA', type: 'varchar2', length: 1 })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'timestamp' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'timestamp', nullable: true })
  fechaDesactiva: Date | null;
}
