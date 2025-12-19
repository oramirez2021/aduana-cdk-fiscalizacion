import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseOracleService } from '../../../shared/base-oracle.service';

/**
 * Servicio de Ejemplo usando SQL Puro (oracledb directo)
 * 
 * Este servicio extiende BaseOracleService y demuestra cuándo y cómo
 * usar queries SQL puros en lugar de TypeORM.
 * 
 * ## Cuándo usar SQL Puro (como este servicio):
 * 
 * ✅ Funciones PL/SQL (courier_consultas.*, util_consultas.*, etc.)
 * ✅ Queries con XMLTYPE y EXTRACTVALUE
 * ✅ CTEs (Common Table Expressions) complejos
 * ✅ Paginación con ROWNUM
 * ✅ Subconsultas anidadas (3+ niveles)
 * ✅ UNIONs complejos con lógica condicional
 * ✅ Procedimientos almacenados
 * ✅ Queries con funciones Oracle específicas (NVL, DECODE, TO_CHAR, etc.)
 * 
 * ## Ventajas de usar SQL Puro:
 * 
 * - Control total sobre el query generado
 * - Performance optimizado manualmente
 * - Acceso a todas las funcionalidades de Oracle
 * - Uso de funciones PL/SQL del monolito
 */
@Injectable()
export class EjemploOracleService extends BaseOracleService {
  constructor(configService: ConfigService) {
    super(configService);
  }

  /**
   * Ejemplo 1: Query simple con executeQuery
   * (Helper que maneja apertura/cierre de conexión automáticamente)
   */
  async consultaSimple(activo: string): Promise<any[]> {
    const query = `
      SELECT 
        ID,
        NOMBRE,
        DESCRIPCION,
        ACTIVO,
        FECHA_CREACION
      FROM FISCALIZACIONES.EJEMPLO_TABLA
      WHERE ACTIVO = :activo
      ORDER BY NOMBRE
    `;

    return await this.executeQuery(query, { activo });
  }

  /**
   * Ejemplo 2: Query con funciones Oracle (NVL, TO_CHAR, etc.)
   */
  async consultaConFunciones(): Promise<any[]> {
    const query = `
      SELECT 
        ID,
        NOMBRE,
        NVL(DESCRIPCION, 'Sin descripción') as DESCRIPCION,
        DECODE(ACTIVO, 'S', 'Activo', 'Inactivo') as ESTADO,
        TO_CHAR(FECHA_CREACION, 'DD/MM/YYYY HH24:MI:SS') as FECHA_FORMATEADA
      FROM FISCALIZACIONES.EJEMPLO_TABLA
      WHERE ACTIVO = 'S'
    `;

    return await this.executeQuery(query);
  }

  /**
   * Ejemplo 3: Query con paginación ROWNUM
   */
  async consultaPaginada(pagina: number = 1, porPagina: number = 10): Promise<{
    data: any[],
    total: number
  }> {
    // 1. Obtener total de registros
    const countQuery = `
      SELECT COUNT(*) as TOTAL
      FROM FISCALIZACIONES.EJEMPLO_TABLA
      WHERE ACTIVO = 'S'
    `;
    
    const countResult = await this.executeQuery(countQuery);
    const total = Number(countResult[0]?.TOTAL || 0);

    // 2. Query paginado
    const dataQuery = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            ID,
            NOMBRE,
            DESCRIPCION,
            ACTIVO,
            FECHA_CREACION
          FROM FISCALIZACIONES.EJEMPLO_TABLA
          WHERE ACTIVO = 'S'
          ORDER BY FECHA_CREACION DESC
        ) a 
        WHERE ROWNUM <= :pagina * :porPagina
      )
      WHERE rnum > (:pagina - 1) * :porPagina
    `;

    const data = await this.executeQuery(dataQuery, {
      pagina,
      porPagina
    });

    return { data, total };
  }

  /**
   * Ejemplo 4: Query con CTE (Common Table Expression)
   */
  async consultaConCTE(): Promise<any[]> {
    const query = `
      WITH ejemplo_activos AS (
        SELECT 
          ID,
          NOMBRE,
          DESCRIPCION,
          FECHA_CREACION,
          ROW_NUMBER() OVER (ORDER BY FECHA_CREACION DESC) as ORDEN
        FROM FISCALIZACIONES.EJEMPLO_TABLA
        WHERE ACTIVO = 'S'
      ),
      estadisticas AS (
        SELECT 
          COUNT(*) as TOTAL,
          MIN(FECHA_CREACION) as FECHA_MAS_ANTIGUA,
          MAX(FECHA_CREACION) as FECHA_MAS_RECIENTE
        FROM ejemplo_activos
      )
      SELECT 
        e.*,
        s.TOTAL,
        s.FECHA_MAS_ANTIGUA,
        s.FECHA_MAS_RECIENTE
      FROM ejemplo_activos e
      CROSS JOIN estadisticas s
      WHERE e.ORDEN <= 10
    `;

    return await this.executeQuery(query);
  }

  /**
   * Ejemplo 5: Query con manejo manual de conexión
   * (Para casos donde necesitas más control)
   */
  async consultaConTransaccion(nombre: string): Promise<void> {
    let connection;
    try {
      connection = await this.getOracleConnection();

      // Iniciar transacción
      await connection.execute(`
        INSERT INTO FISCALIZACIONES.EJEMPLO_TABLA 
        (ID, NOMBRE, ACTIVO, FECHA_CREACION)
        VALUES 
        (FISCALIZACIONES.SEQ_EJEMPLO.NEXTVAL, :nombre, 'S', SYSDATE)
      `, { nombre });

      // Más operaciones...

      // Commit
      await connection.commit();
      this.logger.log(`✅ Registro creado: ${nombre}`);
    } catch (error) {
      // Rollback en caso de error
      if (connection) {
        await connection.rollback();
      }
      this.logger.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Ejemplo 6: Simulación de función PL/SQL del monolito
   * (Como las del paquete courier_consultas)
   */
  async consultaConFuncionPLSQL(idDocumento: number): Promise<any[]> {
    const query = `
      SELECT 
        D.ID,
        D.NOMBRE,
        -- Simulación de función PL/SQL (en el monolito serían funciones reales)
        -- COURIER_CONSULTAS.GTIME_GETPRODUCTOSASSTRING(D.ID) as PRODUCTOS,
        -- COURIER_CONSULTAS.GTIME_GETMARCASASSTRING(D.ID) as MARCAS,
        'Producto 1, Producto 2' as PRODUCTOS_SIMULADO,
        'Marca 1, Marca 2' as MARCAS_SIMULADO
      FROM FISCALIZACIONES.EJEMPLO_TABLA D
      WHERE D.ID = :idDocumento
    `;

    return await this.executeQuery(query, { idDocumento });
  }
}

