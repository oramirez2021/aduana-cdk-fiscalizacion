import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EjemploTypeormService } from './services/ejemplo-typeorm.service';
import { EjemploOracleService } from './services/ejemplo-oracle.service';
import { CrearEjemploDto, EjemploResponseDto } from './dto/ejemplo.dto';

/**
 * Controlador de Ejemplo
 * 
 * Este controlador demuestra cómo usar ambos enfoques (TypeORM y SQL Puro)
 * en un mismo módulo, eligiendo el apropiado según la complejidad de la operación.
 */
@ApiTags('ejemplo')
@Controller('api/ejemplo')
export class EjemploController {
  constructor(
    private readonly typeormService: EjemploTypeormService,
    private readonly oracleService: EjemploOracleService,
  ) {}

  // ===================================================================
  // Endpoints usando TypeORM (operaciones CRUD simples)
  // ===================================================================

  @Get('typeorm/:id')
  @ApiOperation({ 
    summary: 'Obtener ejemplo por ID (TypeORM)',
    description: 'Ejemplo de query simple usando TypeORM findOne'
  })
  @ApiParam({ name: 'id', description: 'ID del ejemplo' })
  @ApiResponse({ status: 200, description: 'Ejemplo encontrado', type: EjemploResponseDto })
  @ApiResponse({ status: 404, description: 'Ejemplo no encontrado' })
  async obtenerPorId(@Param('id') id: number) {
    return await this.typeormService.obtenerPorId(id);
  }

  @Get('typeorm/activos')
  @ApiOperation({ 
    summary: 'Listar ejemplos activos (TypeORM)',
    description: 'Ejemplo de query con filtro simple usando TypeORM find'
  })
  @ApiResponse({ status: 200, description: 'Lista de ejemplos activos', type: [EjemploResponseDto] })
  async listarActivos() {
    return await this.typeormService.listarActivos();
  }

  @Get('typeorm/buscar')
  @ApiOperation({ 
    summary: 'Buscar ejemplos por nombre (TypeORM)',
    description: 'Ejemplo de query builder de TypeORM'
  })
  @ApiQuery({ name: 'nombre', description: 'Nombre a buscar (parcial)' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda', type: [EjemploResponseDto] })
  async buscarPorNombre(@Query('nombre') nombre: string) {
    return await this.typeormService.buscarPorNombre(nombre);
  }

  @Post('typeorm')
  @ApiOperation({ 
    summary: 'Crear nuevo ejemplo (TypeORM)',
    description: 'Ejemplo de INSERT usando TypeORM save'
  })
  @ApiResponse({ status: 201, description: 'Ejemplo creado exitosamente', type: EjemploResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearEjemploDto) {
    return await this.typeormService.crear(dto);
  }

  @Put('typeorm/:id')
  @ApiOperation({ 
    summary: 'Actualizar ejemplo (TypeORM)',
    description: 'Ejemplo de UPDATE usando TypeORM update'
  })
  @ApiParam({ name: 'id', description: 'ID del ejemplo a actualizar' })
  @ApiResponse({ status: 200, description: 'Ejemplo actualizado', type: EjemploResponseDto })
  async actualizar(@Param('id') id: number, @Body() dto: Partial<CrearEjemploDto>) {
    return await this.typeormService.actualizar(id, dto);
  }

  @Delete('typeorm/:id')
  @ApiOperation({ 
    summary: 'Desactivar ejemplo (TypeORM)',
    description: 'Ejemplo de soft delete usando TypeORM update'
  })
  @ApiParam({ name: 'id', description: 'ID del ejemplo a desactivar' })
  @ApiResponse({ status: 204, description: 'Ejemplo desactivado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async desactivar(@Param('id') id: number) {
    return await this.typeormService.desactivar(id);
  }

  @Get('typeorm/stats/activos')
  @ApiOperation({ 
    summary: 'Contar ejemplos activos (TypeORM)',
    description: 'Ejemplo de count usando TypeORM'
  })
  @ApiResponse({ status: 200, description: 'Cantidad de ejemplos activos' })
  async contarActivos() {
    const count = await this.typeormService.contarActivos();
    return { total: count };
  }

  // ===================================================================
  // Endpoints usando SQL Puro (queries complejas)
  // ===================================================================

  @Get('oracle/simple')
  @ApiOperation({ 
    summary: 'Query simple con SQL puro',
    description: 'Ejemplo de executeQuery con parámetros bind'
  })
  @ApiQuery({ name: 'activo', description: 'Estado (S/N)', enum: ['S', 'N'] })
  @ApiResponse({ status: 200, description: 'Resultados del query' })
  async consultaSimple(@Query('activo') activo: string = 'S') {
    return await this.oracleService.consultaSimple(activo);
  }

  @Get('oracle/funciones')
  @ApiOperation({ 
    summary: 'Query con funciones Oracle',
    description: 'Ejemplo usando NVL, DECODE, TO_CHAR'
  })
  @ApiResponse({ status: 200, description: 'Resultados con funciones Oracle' })
  async consultaConFunciones() {
    return await this.oracleService.consultaConFunciones();
  }

  @Get('oracle/paginado')
  @ApiOperation({ 
    summary: 'Query paginado con ROWNUM',
    description: 'Ejemplo de paginación estilo Oracle con ROWNUM'
  })
  @ApiQuery({ name: 'pagina', description: 'Número de página', required: false, type: Number })
  @ApiQuery({ name: 'porPagina', description: 'Registros por página', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Resultados paginados' })
  async consultaPaginada(
    @Query('pagina') pagina: number = 1,
    @Query('porPagina') porPagina: number = 10
  ) {
    return await this.oracleService.consultaPaginada(Number(pagina), Number(porPagina));
  }

  @Get('oracle/cte')
  @ApiOperation({ 
    summary: 'Query con CTE (Common Table Expression)',
    description: 'Ejemplo de query complejo con WITH clause'
  })
  @ApiResponse({ status: 200, description: 'Resultados con CTE' })
  async consultaConCTE() {
    return await this.oracleService.consultaConCTE();
  }

  @Post('oracle/transaccion')
  @ApiOperation({ 
    summary: 'Query con transacción manual',
    description: 'Ejemplo de manejo manual de conexión y transacción'
  })
  @ApiResponse({ status: 201, description: 'Transacción completada' })
  @HttpCode(HttpStatus.CREATED)
  async consultaConTransaccion(@Body('nombre') nombre: string) {
    await this.oracleService.consultaConTransaccion(nombre);
    return { message: 'Transacción completada exitosamente' };
  }

  @Get('oracle/plsql/:id')
  @ApiOperation({ 
    summary: 'Query con función PL/SQL simulada',
    description: 'Ejemplo de cómo se llamarían funciones del paquete courier_consultas'
  })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Resultados con función PL/SQL' })
  async consultaConFuncionPLSQL(@Param('id') id: number) {
    return await this.oracleService.consultaConFuncionPLSQL(id);
  }

  // ===================================================================
  // Endpoint informativo
  // ===================================================================

  @Get('info')
  @ApiOperation({ 
    summary: 'Información sobre el patrón híbrido',
    description: 'Explicación de cuándo usar TypeORM vs SQL Puro'
  })
  @ApiResponse({ status: 200, description: 'Información del patrón' })
  getInfo() {
    return {
      patron: 'Híbrido TypeORM + Oracle DB Directo',
      descripcion: 'Este módulo demuestra cómo combinar ambos enfoques',
      
      typeorm: {
        cuando_usar: [
          'SELECT simples con WHERE y ORDER BY',
          'INSERT de registros individuales',
          'UPDATE con condiciones simples',
          'DELETE con validaciones',
          'JOINs básicos (2-3 tablas)',
          'Queries que se benefician de type-safety'
        ],
        ventajas: [
          'Menos código boilerplate',
          'Type-safety en compilación',
          'Gestión automática de conexiones',
          'Transacciones más fáciles',
          'Mapeo automático a objetos'
        ],
        endpoints: [
          'GET /api/ejemplo/typeorm/:id',
          'GET /api/ejemplo/typeorm/activos',
          'GET /api/ejemplo/typeorm/buscar',
          'POST /api/ejemplo/typeorm',
          'PUT /api/ejemplo/typeorm/:id',
          'DELETE /api/ejemplo/typeorm/:id',
          'GET /api/ejemplo/typeorm/stats/activos'
        ]
      },
      
      sql_puro: {
        cuando_usar: [
          'Funciones PL/SQL (courier_consultas.*)',
          'Queries con XMLTYPE',
          'CTEs complejos',
          'Paginación con ROWNUM',
          'Procedimientos almacenados',
          'Funciones Oracle (NVL, DECODE, TO_CHAR, etc.)'
        ],
        ventajas: [
          'Control total sobre el query',
          'Performance optimizado',
          'Acceso a todas las funcionalidades Oracle',
          'Uso de funciones PL/SQL del monolito'
        ],
        endpoints: [
          'GET /api/ejemplo/oracle/simple',
          'GET /api/ejemplo/oracle/funciones',
          'GET /api/ejemplo/oracle/paginado',
          'GET /api/ejemplo/oracle/cte',
          'POST /api/ejemplo/oracle/transaccion',
          'GET /api/ejemplo/oracle/plsql/:id'
        ]
      }
    };
  }
}

