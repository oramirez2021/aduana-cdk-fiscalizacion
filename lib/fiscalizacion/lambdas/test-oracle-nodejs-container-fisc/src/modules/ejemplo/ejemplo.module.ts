import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EjemploController } from './ejemplo.controller';
import { EjemploTypeormService } from './services/ejemplo-typeorm.service';
import { EjemploOracleService } from './services/ejemplo-oracle.service';
import { EjemploEntity } from './entities/ejemplo.entity';

/**
 * Módulo de Ejemplo - Patrón Híbrido
 * 
 * Este módulo demuestra la arquitectura híbrida del proyecto:
 * 
 * 1. **TypeORM** (EjemploTypeormService):
 *    - Para operaciones CRUD simples
 *    - Queries con filtros básicos
 *    - JOINs simples
 * 
 * 2. **SQL Puro** (EjemploOracleService):
 *    - Extiende BaseOracleService
 *    - Para queries complejos
 *    - Funciones PL/SQL
 *    - Características específicas de Oracle
 * 
 * ## Estructura de cualquier módulo futuro:
 * 
 * ```
 * mi-modulo/
 * ├── entities/
 * │   └── mi-entidad.entity.ts         # Entidades TypeORM
 * ├── dto/
 * │   └── mi-dto.dto.ts                 # DTOs con validaciones
 * ├── services/
 * │   ├── mi-modulo-typeorm.service.ts # Servicio con TypeORM
 * │   └── mi-modulo-oracle.service.ts  # Servicio con SQL puro
 * ├── mi-modulo.controller.ts           # Controlador REST
 * └── mi-modulo.module.ts               # Módulo NestJS
 * ```
 */
@Module({
  imports: [
    // Registrar entidades TypeORM del módulo
    TypeOrmModule.forFeature([
      EjemploEntity,
    ]),
  ],
  controllers: [
    EjemploController,
  ],
  providers: [
    EjemploTypeormService,  // Servicio con TypeORM
    EjemploOracleService,   // Servicio con SQL Puro
  ],
  exports: [
    EjemploTypeormService,
    EjemploOracleService,
  ],
})
export class EjemploModule {}

