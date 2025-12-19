import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad que representa un registro de fiscalización
 * Tabla: FISCALIZACIONES.OPFISCREGISTROFISCALIZACI
 */
@Entity({
  name: 'OPFISCREGISTROFISCALIZACI',
  schema: 'FISCALIZACIONES',
})
export class OpFiscRegistroFiscalizacion {
  @PrimaryColumn({ name: 'ID', type: 'number' })
  id: number;

  @PrimaryColumn({ name: 'IDOPFISCACCIONFISCALIZACI', type: 'number' })
  idOpFiscAccionFiscalizaci: number;

  @Column({ name: 'NUMERODOCASOCIADO', type: 'varchar2', length: 50 })
  numeroDocAsociado: string;

  @Column({ name: 'CODIGOTIPODOCUMENTO', type: 'varchar2', length: 10 })
  codigoTipoDocumento: string;

  @Column({
    name: 'IDDOCUMENTOASOCIADO',
    type: 'number',
    nullable: true,
  })
  idDocumentoAsociado: number | null;

  @Column({
    name: 'IDENTIFICACIONVEHICULO',
    type: 'varchar2',
    length: 50,
    nullable: false, // NOT NULL en la BD (Oracle no acepta cadenas vacías, se usa ' ')
  })
  identificacionVehiculo: string;

  @Column({ name: 'FECHAEJECUCION', type: 'timestamp' })
  fechaEjecucion: Date;

  @Column({ name: 'OPADUANERARETENIDA', type: 'char', length: 1 })
  opAduaneraRetenida: string;

  @Column({ name: 'OPTRANSPORTERETENIDA', type: 'char', length: 1 })
  opTransporteRetenida: string;

  @Column({ name: 'IDEJECUTANTE', type: 'number', nullable: true })
  idEjecutante: number | null;

  @Column({
    name: 'NOMBREEJECUTANTE',
    type: 'varchar2',
    length: 100,
    nullable: true,
  })
  nombreEjecutante: string | null;

  @Column({ name: 'ACTIVO', type: 'char', length: 1 })
  activo: string;

  @Column({ name: 'FECHAACTIVA', type: 'timestamp' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'timestamp' })
  fechaDesactiva: Date;

  @Column({ name: 'FECHAMODIFICACION', type: 'timestamp', nullable: true })
  fechaModificacion: Date | null;

  @Column({
    name: 'CODIGODENUNCIA',
    type: 'varchar2',
    length: 50,
    nullable: true,
  })
  codigoDenuncia: string | null;

  @Column({ name: 'TOTALBULTOS', type: 'number', nullable: true })
  totalBultos: number | null;
}

