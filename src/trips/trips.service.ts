import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseService } from '../common/base.service';
import { Trip } from './models/trip.model';
import { TripStop } from './models/trip-stop.model';
import { TripParticipant } from './models/trip-participant.model';
import { User } from '../users/models/user.model';
import { Location } from '../knowledge/models/location.model';
import { Donation } from '../donations/models/donation.model';
import { File } from '../files/models/file.model';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { ApplyTripDto } from './dto/apply-trip.dto';

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
    @InjectModel(TripParticipant)
    private readonly tripParticipantModel: typeof TripParticipant,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
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
    const { stops, ...tripData } = data;
    const trip = await super.create({ ...tripData, created_by: userId });

    if (stops?.length) {
      for (const stop of stops) {
        // Create inline location if provided
        if (stop.location && !stop.location_id) {
          const loc = await Location.create({
            ...stop.location,
            created_by: userId,
          });
          stop.location_id = loc.id;
        }
        const { location, ...stopData } = stop;
        await this.tripStopModel.create({ ...stopData, trip_id: trip.id });
      }
    }

    return this.findOne(trip.id);
  }

  async updateTrip(id: string, data: any) {
    const trip = await this.tripModel.findByPk(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);

    // Can't edit completed/cancelled/archived trips
    if (['completed', 'cancelled', 'archived'].includes(trip.status)) {
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
    const stopCount = await this.tripStopModel.count({
      where: { trip_id: id },
    });
    if (stopCount === 0) {
      throw new BadRequestException('Add at least one stop before publishing');
    }

    await trip.update({ status: 'published' });
    return trip;
  }

  async archiveTrip(id: string) {
    const trip = await this.tripModel.findByPk(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.status !== 'completed') {
      throw new BadRequestException('Only completed trips can be archived');
    }
    await trip.update({ status: 'archived' });
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
      {
        where: {
          trip_id: id,
          status: { [Op.in]: ['registered', 'confirmed', 'waitlisted'] },
        },
      },
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

  async addStop(tripId: string, data: any, userId?: string) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    // Create inline location if provided
    if (data.location && !data.location_id && userId) {
      const loc = await Location.create({
        ...data.location,
        created_by: userId,
      });
      data.location_id = loc.id;
    }

    // Validate location if provided
    if (data.location_id) {
      const location = await Location.findByPk(data.location_id);
      if (!location)
        throw new NotFoundException(`Location ${data.location_id} not found`);
    }

    const { location, ...stopData } = data;
    return this.tripStopModel.create({ ...stopData, trip_id: tripId });
  }

  async updateStop(tripId: string, stopId: string, data: any) {
    const stop = await this.tripStopModel.findOne({
      where: { id: stopId, trip_id: tripId },
    });
    if (!stop)
      throw new NotFoundException(`Stop ${stopId} not found in trip ${tripId}`);
    await stop.update(data);
    return stop;
  }

  async removeStop(tripId: string, stopId: string) {
    const stop = await this.tripStopModel.findOne({
      where: { id: stopId, trip_id: tripId },
    });
    if (!stop)
      throw new NotFoundException(`Stop ${stopId} not found in trip ${tripId}`);
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

  async registerParticipant(
    tripId: string,
    userId: string | null,
    data: any = {},
  ) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    if (trip.status !== 'published') {
      throw new BadRequestException('Can only register for published trips');
    }

    // Guest registration requires guest_name and guest_email
    if (!userId) {
      if (!data.guest_name || !data.guest_email) {
        throw new BadRequestException(
          'Guest name and email are required for guest registration',
        );
      }
    }

    // Check if already registered (by user_id or guest_email)
    if (userId) {
      const existing = await this.tripParticipantModel.findOne({
        where: {
          trip_id: tripId,
          user_id: userId,
          status: { [Op.in]: ['registered', 'confirmed', 'waitlisted'] },
        },
      });
      if (existing)
        throw new ConflictException('Already registered for this trip');
    } else if (data.guest_email) {
      const existing = await this.tripParticipantModel.findOne({
        where: {
          trip_id: tripId,
          guest_email: data.guest_email,
          status: { [Op.in]: ['registered', 'confirmed', 'waitlisted'] },
        },
      });
      if (existing)
        throw new ConflictException(
          'This email is already registered for this trip',
        );
    }

    // Check capacity
    let status = 'registered';
    if (trip.max_participants) {
      const activeCount = await this.tripParticipantModel.count({
        where: {
          trip_id: tripId,
          status: { [Op.in]: ['registered', 'confirmed'] },
        },
      });
      if (activeCount >= trip.max_participants) {
        status = 'waitlisted';
      }
    }

    return this.tripParticipantModel.create({
      trip_id: tripId,
      user_id: userId || null,
      guest_name: data.guest_name || null,
      guest_email: data.guest_email || null,
      status,
      role: data.role || 'participant',
      notes: data.notes,
      donation_id: data.donation_id,
      registered_at: new Date(),
    } as any);
  }

  async cancelRegistration(tripId: string, userId: string) {
    const participant = await this.tripParticipantModel.findOne({
      where: {
        trip_id: tripId,
        user_id: userId,
        status: { [Op.in]: ['registered', 'confirmed', 'waitlisted'] },
      },
    });
    if (!participant) throw new NotFoundException('Registration not found');

    const wasActive = ['registered', 'confirmed'].includes(participant.status);
    await participant.update({ status: 'cancelled' });

    // Only promote waitlisted if an active (registered/confirmed) spot was freed
    if (wasActive) {
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
    }

    return { message: 'Registration cancelled' };
  }

  async updateParticipantStatus(
    tripId: string,
    participantId: string,
    status: string,
  ) {
    const participant = await this.tripParticipantModel.findOne({
      where: { id: participantId, trip_id: tripId },
    });
    if (!participant) throw new NotFoundException('Participant not found');
    await participant.update({ status });
    return participant;
  }

  // ─── FORM APPLICATION ────────────────────────────────────

  async applyToTrip(
    tripId: string,
    dto: ApplyTripDto,
    files: Express.Multer.File[] = [],
  ) {
    const trip = await this.tripModel.findByPk(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
    if (trip.status !== 'published') {
      throw new BadRequestException('This trip is not accepting applications');
    }

    // Validate answers against application_form if defined
    if (trip.application_form?.fields) {
      for (const field of trip.application_form.fields) {
        if (
          field.required &&
          field.type !== 'checkbox' &&
          field.type !== 'file_multiple'
        ) {
          if (!dto.answers[field.name] && dto.answers[field.name] !== false) {
            throw new BadRequestException(`Field "${field.name}" is required`);
          }
        }
        if (field.type === 'email' && dto.answers[field.name]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(dto.answers[field.name])) {
            throw new BadRequestException(
              `Field "${field.name}" must be a valid email`,
            );
          }
        }
      }
    }

    // Duplicate check
    const email = dto.answers.email || dto.answers.Email;
    if (email) {
      const byEmail = await this.tripParticipantModel.findOne({
        where: { trip_id: tripId, guest_email: email },
      });
      if (byEmail) {
        throw new ConflictException(
          'This email is already registered for this trip',
        );
      }
    }
    if (dto.user_id) {
      const byUser = await this.tripParticipantModel.findOne({
        where: {
          trip_id: tripId,
          user_id: dto.user_id,
          status: { [Op.in]: ['registered', 'confirmed', 'waitlisted'] },
        },
      });
      if (byUser) {
        throw new ConflictException('You have already applied to this trip');
      }
    }

    // Capacity check — auto-waitlist if full
    let status = 'registered';
    if (trip.max_participants) {
      const activeCount = await this.tripParticipantModel.count({
        where: {
          trip_id: tripId,
          status: { [Op.in]: ['registered', 'confirmed'] },
        },
      });
      if (activeCount >= trip.max_participants) status = 'waitlisted';
    }

    const guestName = dto.answers.first_name
      ? `${dto.answers.first_name} ${dto.answers.last_name || ''}`.trim()
      : null;

    const participant = await this.tripParticipantModel.create({
      trip_id: tripId,
      user_id: dto.user_id || null,
      guest_name: guestName,
      guest_email: email || null,
      form_answers: dto.answers,
      status,
      role: 'participant',
      registered_at: new Date(),
    } as any);

    // Upload attached files
    for (const file of files) {
      const url = await this.storageService.uploadFile(file, 'trips');
      await File.create({
        participant_id: participant.id,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        path: url,
        uploaded_by: dto.user_id || null,
        upload_date: new Date(),
      } as any);
    }

    // Send confirmation email
    if (email) {
      await this.emailService.sendOpenCallConfirmationEmail(
        email,
        dto.answers.first_name || 'Applicant',
        trip.title,
      );
    }

    return participant;
  }

  // ─── ARCHIVE (past & completed trips) ────────────────────

  async getArchive(query: any = {}) {
    return super.findAll(
      { ...query, status: { [Op.in]: ['completed', 'cancelled', 'archived'] } },
      {
        include: this.defaultInclude,
        searchableFields: ['title', 'description', 'category'],
        order: [['end_date', 'DESC']],
      },
    );
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
      participants: {
        registered,
        confirmed,
        waitlisted,
        total: registered + confirmed,
      },
      spots_remaining: trip.max_participants
        ? Math.max(0, trip.max_participants - registered - confirmed)
        : null,
    };
  }
}
