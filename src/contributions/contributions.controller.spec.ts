import { Test, TestingModule } from '@nestjs/testing';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';

describe('ContributionsController', () => {
  let controller: ContributionsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContributionsController],
      providers: [{ provide: ContributionsService, useValue: service }],
    }).compile();

    controller = module.get<ContributionsController>(ContributionsController);
  });

  it('should create a contribution', async () => {
    const body = { title: 'Story', description: 'desc' };
    const req = { user: { sub: 'u1' } };
    service.create.mockResolvedValue({ id: 'c1', ...body, user_id: 'u1' } as any);

    const result = await controller.create(body, req);

    expect(service.create).toHaveBeenCalledWith({ ...body, user_id: 'u1' });
    expect(result).toHaveProperty('id');
  });

  it('should list contributions with query params', async () => {
    service.findAll.mockResolvedValue({
      rows: [{ id: 'c1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    } as any);

    const result = await controller.findAll({ page: '1', status: 'draft' });

    expect(service.findAll).toHaveBeenCalledWith({ page: '1', status: 'draft' });
    expect(result).toHaveProperty('rows');
    expect(result).toHaveProperty('meta');
  });

  it('should get a contribution by ID', async () => {
    service.findOne.mockResolvedValue({ id: 'c1', title: 'Story' } as any);

    const result = await controller.findOne('c1');

    expect(service.findOne).toHaveBeenCalledWith('c1');
    expect(result).toHaveProperty('title', 'Story');
  });

  it('should update a contribution', async () => {
    service.update.mockResolvedValue({ id: 'c1', title: 'Updated' } as any);

    const result = await controller.update('c1', { title: 'Updated' });

    expect(service.update).toHaveBeenCalledWith('c1', { title: 'Updated' });
  });

  it('should delete a contribution', async () => {
    service.remove.mockResolvedValue({ message: 'Deleted' } as any);

    const result = await controller.remove('c1');

    expect(service.remove).toHaveBeenCalledWith('c1');
    expect(result).toHaveProperty('message');
  });
});