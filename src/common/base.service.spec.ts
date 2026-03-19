import { NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { Op } from 'sequelize';

describe('BaseService', () => {
  let service: BaseService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      name: 'TestModel',
      rawAttributes: {
        id: {},
        title: {},
        status: {},
        createdAt: {},
      },
      findAndCountAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    service = new BaseService(mockModel);
  });

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results with default params', async () => {
      mockModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: '1' }],
        count: 1,
      });

      const result = await service.findAll();

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          limit: 10,
          offset: 0,
          distinct: true,
        }),
      );
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination params', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 50 });

      const result = await service.findAll({ page: '3', limit: '5' });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 10, // (3-1) * 5
        }),
      );
      expect(result.meta.totalPages).toBe(10);
    });

    it('should cap limit at 100', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ limit: '999' });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });

    it('should filter by valid model attributes only', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({
        status: 'published',
        malicious_field: 'drop table',
      });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('status', 'published');
      expect(callArgs.where).not.toHaveProperty('malicious_field');
    });

    it('should ignore reserved query keys in where clause', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({
        page: '1',
        limit: '10',
        sortBy: 'title',
        order: 'ASC',
        search: 'test',
      });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('page');
      expect(callArgs.where).not.toHaveProperty('limit');
      expect(callArgs.where).not.toHaveProperty('sortBy');
    });

    it('should support search across specified fields', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll(
        { search: 'test' },
        { searchableFields: ['title', 'description'] },
      );

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where[Op.or]).toHaveLength(2);
    });

    it('should sort by valid model fields only', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ sortBy: 'title', order: 'DESC' });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.order).toEqual([['title', 'DESC']]);
    });

    it('should ignore sort by non-model fields', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ sortBy: 'malicious; DROP TABLE', order: 'DESC' });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.order).toBeUndefined();
    });

    it('should default sort order to ASC', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ sortBy: 'title' });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.order).toEqual([['title', 'ASC']]);
    });
  });

  // ─── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return record by ID', async () => {
      const record = { id: 'uuid-1', title: 'Test' };
      mockModel.findByPk.mockResolvedValue(record);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(record);
      expect(mockModel.findByPk).toHaveBeenCalledWith(
        'uuid-1',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when record not found', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return new record', async () => {
      const data = { title: 'New Item' };
      const created = { id: 'new-uuid', ...data };
      mockModel.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(mockModel.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(created);
    });
  });

  // ─── update ────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return updated record', async () => {
      mockModel.update.mockResolvedValue([1]); // 1 row affected
      const updated = { id: 'uuid-1', title: 'Updated' };
      mockModel.findByPk.mockResolvedValue(updated);

      const result = await service.update('uuid-1', {
        title: 'Updated',
      } as any);

      expect(mockModel.update).toHaveBeenCalledWith(
        { title: 'Updated' },
        { where: { id: 'uuid-1' } },
      );
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if update affects 0 rows', async () => {
      mockModel.update.mockResolvedValue([0]);

      await expect(
        service.update('nonexistent', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return success message', async () => {
      mockModel.destroy.mockResolvedValue(1);

      const result = await service.remove('uuid-1');

      expect(mockModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('uuid-1');
    });

    it('should throw NotFoundException if delete affects 0 rows', async () => {
      mockModel.destroy.mockResolvedValue(0);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
