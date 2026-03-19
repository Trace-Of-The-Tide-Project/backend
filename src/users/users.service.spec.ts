import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UserRole } from './models/user-role.model';
import { UserProfile } from './models/user-profile.model';
import { Role } from '../roles/models/role.model';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUser = {
    id: 'user-uuid-1',
    username: 'testuser',
    full_name: 'Test User',
    email: 'test@trace.ps',
    status: 'active',
  };

  beforeEach(async () => {
    mockUserModel = {
      name: 'User',
      rawAttributes: {
        id: {},
        username: {},
        full_name: {},
        email: {},
        phone_number: {},
        password: {},
        status: {},
        createdAt: {},
      },
      findByPk: jest.fn(),
      findOne: jest.fn(),
      findAndCountAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ─── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return user by ID without password', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.objectContaining({
          attributes: { exclude: ['password'] },
        }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findByEmail ───────────────────────────────────────────

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@trace.ps');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'test@trace.ps' },
      });
    });

    it('should throw NotFoundException when email not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('unknown@trace.ps')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when email is empty', async () => {
      await expect(service.findByEmail('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated users with search', async () => {
      mockUserModel.findAndCountAll.mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      const result = await service.findAll({
        page: '1',
        limit: '10',
        search: 'test',
      });

      expect(result.rows).toHaveLength(1);
      expect(result.meta).toHaveProperty('total', 1);
    });
  });

  // ─── getUserRoles ──────────────────────────────────────────

  describe('getUserRoles', () => {
    it('should return array of role names for user', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      jest
        .spyOn(UserRole, 'findAll')
        .mockResolvedValue([
          { toJSON: () => ({ role: { name: 'user' } }) } as any,
          { toJSON: () => ({ role: { name: 'editor' } }) } as any,
        ]);

      const result = await service.getUserRoles('user-uuid-1');

      expect(result).toEqual(['user', 'editor']);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.getUserRoles('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getUserProfile ────────────────────────────────────────

  describe('getUserProfile', () => {
    it('should return user with profile', async () => {
      const userWithProfile = {
        ...mockUser,
        profile: { bio: 'Hello', avatar_url: null },
      };
      mockUserModel.findByPk.mockResolvedValue(userWithProfile);

      const result = await service.getUserProfile('user-uuid-1');

      expect(result).toHaveProperty('profile');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateProfile ─────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update existing profile', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      const mockProfile = { update: jest.fn().mockResolvedValue(true) };
      jest.spyOn(UserProfile, 'findOne').mockResolvedValue(mockProfile as any);

      await service.updateProfile('user-uuid-1', { bio: 'Updated bio' } as any);

      expect(mockProfile.update).toHaveBeenCalledWith({ bio: 'Updated bio' });
    });

    it('should create profile if none exists', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      jest.spyOn(UserProfile, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(UserProfile, 'create')
        .mockResolvedValue({ bio: 'New' } as any);

      const result = await service.updateProfile('user-uuid-1', {
        bio: 'New',
      } as any);

      expect(UserProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid-1',
          bio: 'New',
        }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
