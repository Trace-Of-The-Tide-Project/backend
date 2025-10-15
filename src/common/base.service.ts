import { NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';

export class BaseService<T = any> {
  constructor(protected readonly model: any) {}

  // findAll: يدعم query pagination/filter/search/sort + include + order
  async findAll(
    query: any = {},
    options: {
      searchableFields?: string[];
      include?: any[];
      order?: any[];
    } = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    // dynamic filtering: أي query key غير محفوظ يدخل كـ where
    for (const key in query) {
      if (!['page', 'limit', 'sortBy', 'order', 'search'].includes(key)) {
        where[key] = query[key];
      }
    }

    // search across fields
    if (
      query.search &&
      Array.isArray(options.searchableFields) &&
      options.searchableFields.length
    ) {
      where[Op.or] = options.searchableFields.map((field) => ({
        [field]: { [Op.iLike]: `%${query.search}%` },
      }));
    }

    // sorting
    let order: any[] | undefined = undefined;
    if (query.sortBy) {
      order = [
        [query.sortBy, query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'],
      ];
    } else if (options.order) {
      order = options.order;
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: options.include || [],
      limit,
      offset,
      order,
      distinct: true,
    });

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

  async findOne(id: string, options?: { include?: any[] }) {
    const record = await this.model.findByPk(id, {
      include: options?.include || [],
    });
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
    // return the updated record (with no include)
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
