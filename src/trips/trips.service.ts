import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Trip } from './models/trip.model';
import { TripStop } from './models/trip-stop.model';
import { TripParticipant } from './models/trip-participant.model';
import { User } from '../users/models/user.model';
import { Location } from '../knowledge/models/location.model';
import { Donation } from '../donations/models/donation.model';

@Injectable()
export class TripsService extends BaseService<Trip> {
  private readonly defaultInclude = [
    { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
    {
      model: TripStop,
      include: [{ model: Location }],
      order: [['stop_order', 'ASC']],
    },
    {
      model: TripParticipant,
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    },
  ];

  constructor(
    @InjectModel(Trip) private readonly tripModel: typeof Trip,
    @InjectModel(TripStop) private readonly tripStopModel: typeof TripStop,
    @InjectModel(TripParticipant) private readonly tripParticipantModel: typeof TripParticipant,
  ) {
    super(tripModel);
  }

  // ─── TRIPS ────────────────────────────────────────────────

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'description', 'category', 'route_summary'],
      order: [['start_date', 'ASC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async createTrip(data: any, userId: string) {
    return super.create({ ...data, created_by: userId });
  }

  async updateTrip(id: string, data: any) {
    const trip = await this.tripModel.findByPk(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);

    // Can't edit completed/cancelled trips
    if (['completed', 'cancelled'].includes(trip.status)) {
      throw new BadRequestException(`Cannot edit a ${trip.status} trip`);
    }

    return super.update(id, data);
  }

  async publishTrip(id: string) {
    const trip = await this.tripModel.findByPk(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.status !== 'draft') {
      throw new BadRequestException('Only draft trips can be published');
    }

    // Must have at least one stop
    const stopCount = await this.tripStopModel.count({ where: { trip_id: id } });
    if (stopCount === 0) {
      throw new BadRequestException('Add at least one stop before publishing');
    }

    await trip.update({ status: 'published' });
    return trip;
  }

  async cancelTrip(id: string) {
    const trip = await this.tripModel.findByPk(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.status === 'cancelled') {
      throw new BadRequestException('Trip is already cancelled');
    }

    // Cancel all registered participants
    await this.tripParticipantModel.update(
      { status: 'cancelled' },
      { where: { trip_id: id, status: ['registered', 'confirmed', 'waitlisted'] } },
    );

    await trip.update({ status: 'cancelled' });
    return trip;
  }

  // ─── STOPS ────────────────────────────────────────────────

  async getStops(tripId: string) {
    await this.findOne(tripId); // validate trip exists
    return this.tripStopModel.findAll({
      where: { trip_id: tripId },
      include: [{ model: Location }],
      order: [['stop_order', 'ASC']],
    });
  }

  async addStop(tripId: string, data: any) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    // Validate location if provided
    if (data.location_id) {
      const location = await Location.findByPk(data.location_id);
      if (!location) throw new NotFoundException(`Location ${data.location_id} not found`);
    }

    return this.tripStopModel.create({ ...data, trip_id: tripId } as any);
  }

  async updateStop(tripId: string, stopId: string, data: any) {
    const stop = await this.tripStopModel.findOne({
      where: { id: stopId, trip_id: tripId },
    });
    if (!stop) throw new NotFoundException(`Stop ${stopId} not found in trip ${tripId}`);
    await stop.update(data);
    return stop;
  }

  async removeStop(tripId: string, stopId: string) {
    const stop = await this.tripStopModel.findOne({
      where: { id: stopId, trip_id: tripId },
    });
    if (!stop) throw new NotFoundException(`Stop ${stopId} not found in trip ${tripId}`);
    await stop.destroy();
    return { message: 'Stop removed' };
  }

  async reorderStops(tripId: string, stopIds: string[]) {
    await this.findOne(tripId); // validate trip exists
    for (let i = 0; i < stopIds.length; i++) {
      await this.tripStopModel.update(
        { stop_order: i + 1 },
        { where: { id: stopIds[i], trip_id: tripId } },
      );
    }
    return this.getStops(tripId);
  }

  // ─── PARTICIPANTS ─────────────────────────────────────────

  async getParticipants(tripId: string) {
    await this.findOne(tripId);
    return this.tripParticipantModel.findAll({
      where: { trip_id: tripId },
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
        { model: Donation },
      ],
      order: [['registered_at', 'ASC']],
    });
  }

  async registerParticipant(tripId: string, userId: string, data: any = {}) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    if (trip.status !== 'published') {
      throw new BadRequestException('Can only register for published trips');
    }

    // Check if already registered
    const existing = await this.tripParticipantModel.findOne({
      where: { trip_id: tripId, user_id: userId, status: ['registered', 'confirmed', 'waitlisted'] },
    });
    if (existing) throw new ConflictException('Already registered for this trip');

    // Check capacity
    let status = 'registered';
    if (trip.max_participants) {
      const activeCount = await this.tripParticipantModel.count({
        where: { trip_id: tripId, status: ['registered', 'confirmed'] },
      });
      if (activeCount >= trip.max_participants) {
        status = 'waitlisted';
      }
    }

    return this.tripParticipantModel.create({
      trip_id: tripId,
      user_id: userId,
      status,
      role: data.role || 'participant',
      notes: data.notes,
      donation_id: data.donation_id,
      registered_at: new Date(),
    } as any);
  }

  async cancelRegistration(tripId: string, userId: string) {
    const participant = await this.tripParticipantModel.findOne({
      where: { trip_id: tripId, user_id: userId, status: ['registered', 'confirmed', 'waitlisted'] },
    });
    if (!participant) throw new NotFoundException('Registration not found');

    await participant.update({ status: 'cancelled' });

    // Promote first waitlisted person if a confirmed/registered spot opened
    const trip = await this.tripModel.findByPk(tripId);
    if (trip?.max_participants) {
      const nextWaitlisted = await this.tripParticipantModel.findOne({
        where: { trip_id: tripId, status: 'waitlisted' },
        order: [['registered_at', 'ASC']],
      });
      if (nextWaitlisted) {
        await nextWaitlisted.update({ status: 'registered' });
      }
    }

    return { message: 'Registration cancelled' };
  }

  async updateParticipantStatus(tripId: string, participantId: string, status: string) {
    const participant = await this.tripParticipantModel.findOne({
      where: { id: participantId, trip_id: tripId },
    });
    if (!participant) throw new NotFoundException('Participant not found');
    await participant.update({ status });
    return participant;
  }

  // ─── STATS ────────────────────────────────────────────────

  async getTripStats(tripId: string) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    const registered = await this.tripParticipantModel.count({
      where: { trip_id: tripId, status: 'registered' },
    });
    const confirmed = await this.tripParticipantModel.count({
      where: { trip_id: tripId, status: 'confirmed' },
    });
    const waitlisted = await this.tripParticipantModel.count({
      where: { trip_id: tripId, status: 'waitlisted' },
    });
    const stopCount = await this.tripStopModel.count({
      where: { trip_id: tripId },
    });

    return {
      trip_id: tripId,
      status: trip.status,
      stops: stopCount,
      participants: { registered, confirmed, waitlisted, total: registered + confirmed },
      spots_remaining: trip.max_participants
        ? Math.max(0, trip.max_participants - registered - confirmed)
        : null,
    };
  }
}