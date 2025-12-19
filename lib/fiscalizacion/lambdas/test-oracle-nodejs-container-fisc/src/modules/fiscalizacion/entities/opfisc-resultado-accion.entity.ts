import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entidad que representa un resultado aplicado en una acción de fiscalización
 * Tabla: FISCALIZACIONES.OPFISCRESULTADOACCION
 * PK: ID (se obtiene manualmente de la secuencia SEC_OpFiscResultadoAccion)
 */
@Entity({
  name: 'OPFISCRESULTADOACCION',
  schema: 'FISCALIZACIONES',
})
export class OpFiscResultadoAccion {
  @PrimaryColumn({
    name: 'ID',
    type: 'number',
  })
  id: number;

  @Column({ name: 'IDOPFISCREGISTROFISCALIZA', type: 'number' })
  idOpFiscRegistroFiscaliza: number;

  @Column({ name: 'IDOPFISCACCIONFISCALIZACI', type: 'number' })
  idOpFiscAccionFiscalizaci: number;

  @Column({ name: 'CODIGOOPFISCRESULTADO', type: 'varchar2', length: 20 })
  codigoOpFiscResultado: string;

  @Column({
    name: 'OBSERVACION',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  observacion: string | null;

  @Column({ name: 'ACTIVO', type: 'char', length: 1 })
  activo: string;

  @Column({ name: 'FECHAACTIVO', type: 'timestamp' })
  fechaActivo: Date;

  @Column({ name: 'FECHADESACTIVO', type: 'timestamp' })
  fechaDesactivo: Date;
}

