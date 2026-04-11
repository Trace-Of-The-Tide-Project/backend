import { Test, TestingModule } from '@nestjs/testing';
import { ContributionsService } from './contributions.service';
import { getModelToken } from '@nestjs/sequelize';
import { Contribution } from './models/contribution.model';
import { ContributionType } from './models/contribution-type.model';
import { File } from '../files/models/file.model';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('ContributionsService', () => {
  let service: ContributionsService;
  let mockModel: any;

  const mockContribution = {
    id: 'contrib-uuid-1',
    title: 'My Story',
    description: 'A tale of migration',
    status: 'draft',
    user_id: 'user-uuid-1',
    submission_date: new Date(),
  };

  beforeEach(async () => {
    mockModel = {
      name: 'Contribution',
      rawAttributes: {
        id: {},
        title: {},
        description: {},
        type_id: {},
        user_id: {},
        status: {},
        submission_date: {},
        createdAt: {},
      },
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    const mockFileModel = {
      name: 'File',
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionsService,
        { provide: getModelToken(Contribution), useValue: mockModel },
        {
          provide: getModelToken(ContributionType),
          useValue: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
          },
        },
        { provide: getModelToken(File), useValue: mockFileModel },
        {
          provide: StorageService,
          useValue: { uploadFile: jest.fn(), getSignedUrl: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ContributionsService>(ContributionsService);
  });

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated contributions', async () => {
      mockModel.findAndCountAll.mockResolvedValue({
        rows: [mockContribution],
        count: 1,
      });

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.rows).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should support search in title and description', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ search: 'migration' });

      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        }),
      );
    });

    it('should filter by status', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ status: 'published' });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('status', 'published');
    });

    it('should filter by user_id', async () => {
      mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await service.findAll({ user_id: 'user-uuid-1' });

      const callArgs = mockModel.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('user_id', 'user-uuid-1');
    });
  });

  // ─── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a contribution with relations', async () => {
      mockModel.findByPk.mockResolvedValue(mockContribution);

      const result = await service.findOne('contrib-uuid-1');

      expect(result).toEqual(mockContribution);
      expect(mockModel.findByPk).toHaveBeenCalledWith(
        'contrib-uuid-1',
        expect.objectContaining({ include: expect.any(Array) }),
      );
    });

    it('should throw NotFoundException for non-existent contribution', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ────────────────────────────────────────────────

  describe('create', () => {
    it('should create contribution with default status=draft and submission_date', async () => {
      mockModel.create.mockResolvedValue({
        ...mockContribution,
        status: 'draft',
      });

      const result = await service.create({
        title: 'My Story',
        description: 'A tale',
        user_id: 'user-uuid-1',
      } as any);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Story',
          status: 'draft',
          submission_date: expect.any(Date),
        }),
      );
    });

    it('should allow overriding default status', async () => {
      mockModel.create.mockResolvedValue({
        ...mockContribution,
        status: 'pending',
      });

      await service.create({
        title: 'Story',
        status: 'pending',
      } as any);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });
  });

  // ─── update ────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return contribution', async () => {
      mockModel.update.mockResolvedValue([1]);
      mockModel.findByPk.mockResolvedValue({
        ...mockContribution,
        title: 'Updated Title',
      });

      const result = await service.update('contrib-uuid-1', {
        title: 'Updated Title',
      } as any);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException for non-existent contribution', async () => {
      mockModel.update.mockResolvedValue([0]);

      await expect(
        service.update('nonexistent', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete contribution', async () => {
      mockModel.destroy.mockResolvedValue(1);

      const result = await service.remove('contrib-uuid-1');

      expect(result.message).toContain('contrib-uuid-1');
    });

    it('should throw NotFoundException for non-existent contribution', async () => {
      mockModel.destroy.mockResolvedValue(0);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
