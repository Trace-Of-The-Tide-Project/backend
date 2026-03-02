import { Test, TestingModule } from '@nestjs/testing';
import { OpenCallsController } from './open-call.controller';
import { OpenCallsService } from './open-call.service';

describe('OpenCallsController', () => {
  let controller: OpenCallsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      findActiveOpenCalls: jest.fn(),
      findOne: jest.fn(),
      joinOpenCall: jest.fn(),
      leaveOpenCall: jest.fn(),
      findAll: jest.fn(),
      getStats: jest.fn(),
      createOpenCall: jest.fn(),
      updateOpenCall: jest.fn(),
      closeOpenCall: jest.fn(),
      reopenOpenCall: jest.fn(),
      deleteOpenCall: jest.fn(),
      getParticipants: jest.fn(),
      updateParticipant: jest.fn(),
      linkContribution: jest.fn(),
      removeParticipant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenCallsController],
      providers: [{ provide: OpenCallsService, useValue: service }],
    }).compile();

    controller = module.get<OpenCallsController>(OpenCallsController);
  });

  // ─── Public endpoints ──────────────────────────────────────

  describe('findActive', () => {
    it('should return active open calls', async () => {
      const mockData = {
        rows: [{ id: 'oc-1', title: 'Oral Histories', status: 'open' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      service.findActiveOpenCalls.mockResolvedValue(mockData as any);

      const result = await controller.findActive({ page: '1' });

      expect(service.findActiveOpenCalls).toHaveBeenCalledWith({ page: '1' });
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return open call details', async () => {
      const mockCall = { id: 'oc-1', title: 'Photography Call' };
      service.findOne.mockResolvedValue(mockCall as any);

      const result = await controller.findOne('oc-1');

      expect(result).toHaveProperty('title', 'Photography Call');
    });
  });

  // ─── Participant actions ───────────────────────────────────

  describe('join', () => {
    it('should call joinOpenCall with id and body', async () => {
      const body = {
        user_id: 'user-1',
        first_name: 'Ahmad',
        experience: 'photography',
      };
      service.joinOpenCall.mockResolvedValue({ message: 'Joined' } as any);

      const result = await controller.join('oc-1', body);

      expect(service.joinOpenCall).toHaveBeenCalledWith('oc-1', body);
    });
  });

  describe('leave', () => {
    it('should call leaveOpenCall', async () => {
      service.leaveOpenCall.mockResolvedValue({ message: 'Withdrawn' } as any);

      await controller.leave('oc-1', 'user-1');

      expect(service.leaveOpenCall).toHaveBeenCalledWith('oc-1', 'user-1');
    });
  });

  // ─── Admin endpoints ──────────────────────────────────────

  describe('findAll (admin)', () => {
    it('should return all open calls for admin', async () => {
      service.findAll.mockResolvedValue({
        rows: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      } as any);

      const result = await controller.findAll({ status: 'closed' });

      expect(service.findAll).toHaveBeenCalledWith({ status: 'closed' });
    });
  });

  describe('create', () => {
    it('should create an open call', async () => {
      const body = {
        title: 'New Call',
        description: 'Desc',
        category: 'Photography',
        created_by: 'admin-1',
      };
      service.createOpenCall.mockResolvedValue({ id: 'oc-new', ...body } as any);

      const result = await controller.create(body);

      expect(service.createOpenCall).toHaveBeenCalledWith(body);
      expect(result).toHaveProperty('id');
    });
  });

  describe('close', () => {
    it('should close an open call', async () => {
      service.closeOpenCall.mockResolvedValue({ status: 'closed' } as any);

      const result = await controller.close('oc-1');

      expect(service.closeOpenCall).toHaveBeenCalledWith('oc-1');
    });
  });

  describe('reopen', () => {
    it('should reopen a closed call', async () => {
      service.reopenOpenCall.mockResolvedValue({ status: 'open' } as any);

      await controller.reopen('oc-1');

      expect(service.reopenOpenCall).toHaveBeenCalledWith('oc-1');
    });
  });

  describe('remove', () => {
    it('should delete an open call', async () => {
      service.deleteOpenCall.mockResolvedValue({ message: 'Deleted' } as any);

      await controller.remove('oc-1');

      expect(service.deleteOpenCall).toHaveBeenCalledWith('oc-1');
    });
  });

  // ─── Participant management ────────────────────────────────

  describe('getParticipants', () => {
    it('should list participants for an open call', async () => {
      service.getParticipants.mockResolvedValue({
        rows: [{ id: 'p-1', status: 'active' }],
        meta: { total: 1 },
      } as any);

      const result = await controller.getParticipants('oc-1', {});

      expect(service.getParticipants).toHaveBeenCalledWith('oc-1', {});
    });
  });

  describe('updateParticipant', () => {
    it('should update participant status', async () => {
      service.updateParticipant.mockResolvedValue({ status: 'approved' } as any);

      await controller.updateParticipant('oc-1', 'p-1', { status: 'approved' });

      expect(service.updateParticipant).toHaveBeenCalledWith('oc-1', 'p-1', {
        status: 'approved',
      });
    });
  });

  describe('linkContribution', () => {
    it('should link a contribution to a participant', async () => {
      service.linkContribution.mockResolvedValue({ linked: true } as any);

      await controller.linkContribution('oc-1', 'p-1', 'contrib-1');

      expect(service.linkContribution).toHaveBeenCalledWith('oc-1', 'p-1', 'contrib-1');
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant', async () => {
      service.removeParticipant.mockResolvedValue({ message: 'Removed' } as any);

      await controller.removeParticipant('oc-1', 'p-1');

      expect(service.removeParticipant).toHaveBeenCalledWith('oc-1', 'p-1');
    });
  });
});