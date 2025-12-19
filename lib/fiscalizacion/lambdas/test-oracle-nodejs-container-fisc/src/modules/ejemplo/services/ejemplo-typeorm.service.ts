import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EjemploEntity } from '../entities/ejemplo.entity';
import { CrearEjemploDto } from '../dto/ejemplo.dto';

/**
 * Servicio de Ejemplo usando TypeORM
 * 
 * Este servicio demuestra cuándo y cómo usar TypeORM para operaciones
 * CRUD simples en la base de datos Oracle.
 * 
 * ## Cuándo usar TypeORM (como este servicio):
 * 
 * ✅ SELECT simples con WHERE y ORDER BY
 * ✅ INSERT de registros individuales
 * ✅ UPDATE con condiciones simples
 * ✅ DELETE con validaciones
 * ✅ JOINs básicos (2-3 tablas)
 * ✅ Queries que se benefician de type-safety
 * 
 * ## Ventajas de usar TypeORM:
 * 
 * - Menos código boilerplate
 * - Type-safety en tiempo de compilación
 * - Gestión automática de conexiones (pool)
 * - Transacciones más fáciles de manejar
 * - Mapeo automático a objetos TypeScript
 */
@Injectable()
export class EjemploTypeormService {
  constructor(
    @InjectRepository(EjemploEntity)
    private readonly ejemploRepository: Repository<EjemploEntity>,
  ) {}

  /**
   * Ejemplo 1: SELECT simple con findOne
   */
  async obtenerPorId(id: number): Promise<EjemploEntity> {
    return await this.ejemploRepository.findOne({
      where: { id }
    });
  }

  /**
   * Ejemplo 2: SELECT con filtros y ordenamiento
   */
  async listarActivos(): Promise<EjemploEntity[]> {
    return await this.ejemploRepository.find({
      where: { activo: 'S' },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Ejemplo 3: Query Builder para queries más complejos
   */
  async buscarPorNombre(nombre: string): Promise<EjemploEntity[]> {
    return await this.ejemploRepository
      .createQueryBuilder('e')
      .where('UPPER(e.nombre) LIKE UPPER(:nombre)', { nombre: `%${nombre}%` })
      .andWhere('e.activo = :activo', { activo: 'S' })
      .orderBy('e.fechaCreacion', 'DESC')
      .getMany();
  }

  /**
   * Ejemplo 4: INSERT con save
   */
  async crear(dto: CrearEjemploDto): Promise<EjemploEntity> {
    const ejemplo = this.ejemploRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: 'S',
      fechaCreacion: new Date()
    });

    return await this.ejemploRepository.save(ejemplo);
  }

  /**
   * Ejemplo 5: UPDATE
   */
  async actualizar(id: number, dto: Partial<CrearEjemploDto>): Promise<EjemploEntity> {
    await this.ejemploRepository.update(id, dto);
    return await this.obtenerPorId(id);
  }

  /**
   * Ejemplo 6: DELETE (soft delete - cambiar activo a 'N')
   */
  async desactivar(id: number): Promise<void> {
    await this.ejemploRepository.update(id, { activo: 'N' });
  }

  /**
   * Ejemplo 7: Contar registros
   */
  async contarActivos(): Promise<number> {
    return await this.ejemploRepository.count({
      where: { activo: 'S' }
    });
  }
}

