import { NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';

export class BaseService<T = any> {
  constructor(protected readonly model: any) {}

  async findAll(
    query: any = {},
    options: {
      searchableFields?: string[];
      include?: any[];
      order?: any[];
      attributes?: any; // ✅ FIX: Allow excluding fields (e.g. password)
      where?: Record<string, any>;
    } = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100); // ✅ FIX: Cap limit to prevent abuse
    const offset = (page - 1) * limit;

    const where: any = {};

    // ✅ FIX: Whitelist reserved keys more safely
    const reservedKeys = ['page', 'limit', 'sortBy', 'order', 'search'];

    for (const key in query) {
      if (!reservedKeys.includes(key)) {
        // ✅ FIX: Only allow filtering on actual model fields
        if (this.model.rawAttributes && this.model.rawAttributes[key]) {
          where[key] = query[key];
        }
      }
    }

    // Search across fields
    if (
      query.search &&
      Array.isArray(options.searchableFields) &&
      options.searchableFields.length
    ) {
      where[Op.or] = options.searchableFields.map((field) => ({
        [field]: { [Op.iLike]: `%${query.search}%` },
      }));
    }

    // Sorting
    let order: any[] | undefined = undefined;
    if (query.sortBy) {
      // ✅ FIX: Only allow sorting on actual model fields
      if (this.model.rawAttributes && this.model.rawAttributes[query.sortBy]) {
        const direction =
          query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        order = [[query.sortBy, direction]];
      }
    } else if (options.order) {
      order = options.order;
    }

    // Merge caller-supplied where (e.g. pre-built Op filters) with auto-built where
    const mergedWhere = options.where ? { ...options.where, ...where } : where;

    const findOptions: any = {
      where: mergedWhere,
      include: options.include || [],
      limit,
      offset,
      distinct: true,
    };

    if (order) findOptions.order = order;
    if (options.attributes) findOptions.attributes = options.attributes;

    const { rows, count } = await this.model.findAndCountAll(findOptions);

    return {
      rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: string, options?: { include?: any[]; attributes?: any }) {
    const findOptions: any = {
      include: options?.include || [],
    };
    if (options?.attributes) findOptions.attributes = options.attributes;

    const record = await this.model.findByPk(id, findOptions);
    if (!record)
      throw new NotFoundException(
        `${this.model.name || 'Record'} ${id} not found`,
      );
    return record;
  }

  async create(data: Partial<T>) {
    return this.model.create(data as any);
  }

  async update(id: string, data: Partial<T>) {
    const [affected] = await this.model.update(data, { where: { id } });
    if (!affected)
      throw new NotFoundException(
        `${this.model.name || 'Record'} ${id} not found`,
      );
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleted = await this.model.destroy({ where: { id } });
    if (!deleted)
      throw new NotFoundException(
        `${this.model.name || 'Record'} ${id} not found`,
      );
    return {
      message: `${this.model.name || 'Record'} ${id} deleted successfully`,
    };
  }
}
