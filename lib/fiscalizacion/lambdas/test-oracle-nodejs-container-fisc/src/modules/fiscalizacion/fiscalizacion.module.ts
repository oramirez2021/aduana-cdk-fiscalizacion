import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalizacionController } from './controllers/fiscalizacion.controller';
import { FiscalizacionService } from './services/fiscalizacion.service';
import { FiscalizacionRegistroService } from './services/fiscalizacion-registro.service';
import {
  DocDocumentoBase,
  Documento,
  OpFiscAccionFiscalizacion,
  OpFiscTipoFiscalizacion,
  OpFiscResultado,
  OpFiscMarca,
  OpFiscOperacion,
  OpFiscRegistroFiscalizacion,
  OpFiscResultadoAccion,
} from './entities';

/**
 * Módulo de Fiscalización
 * Gestiona operaciones relacionadas con fiscalización de documentos
 *
 * Arquitectura:
 * - Entities: Mapeo de tablas Oracle con TypeORM
 * - Services: Lógica de negocio (usa SQL directo por limitaciones Oracle 11g)
 * - Controllers: Endpoints REST
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocDocumentoBase,
      Documento,
      OpFiscAccionFiscalizacion,
      OpFiscTipoFiscalizacion,
      OpFiscResultado,
      OpFiscMarca,
      OpFiscOperacion,
      OpFiscRegistroFiscalizacion,
      OpFiscResultadoAccion,
    ]),
  ],
  controllers: [FiscalizacionController],
  providers: [FiscalizacionService, FiscalizacionRegistroService],
  exports: [FiscalizacionService, FiscalizacionRegistroService],
})
export class FiscalizacionModule {}

