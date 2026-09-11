import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from '../appointment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prismaService: PrismaService;

  const mockAppointment = {
    id: 'appointment-id',
    patientId: 'patient-id',
    therapistId: 'therapist-id',
    roomId: 'room-id',
    dateTime: new Date('2026-09-15T10:00:00'),
    duration: 45,
    status: 'PENDING',
    notes: 'موعد تجريبي',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTherapist = {
    id: 'therapist-id',
    name: 'د. أحمد محمد',
    role: 'THERAPIST',
  };

  const mockPatient = {
    id: 'patient-id',
    name: 'مريض تجريبي',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn().mockResolvedValue(mockAppointment),
              findFirst: jest.fn().mockResolvedValue(null), // For conflict checking
              findMany: jest.fn().mockResolvedValue([mockAppointment]),
              create: jest.fn().mockResolvedValue(mockAppointment),
              update: jest.fn().mockResolvedValue(mockAppointment),
              delete: jest.fn().mockResolvedValue(mockAppointment),
              count: jest.fn().mockResolvedValue(1),
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(mockTherapist),
            },
            patient: {
              findUnique: jest.fn().mockResolvedValue(mockPatient),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create appointment successfully', async () => {
      const createDto = {
        patientId: 'patient-id',
        therapistId: 'therapist-id',
        dateTime: new Date('2026-09-15T10:00:00'),
        duration: 45,
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockAppointment);
    });

    it('should throw ConflictException when therapist has conflicting appointment', async () => {
      // Mock conflicting appointment
      jest.spyOn(prismaService.appointment, 'findFirst').mockResolvedValue(mockAppointment);

      const createDto = {
        patientId: 'patient-id',
        therapistId: 'therapist-id',
        dateTime: new Date('2026-09-15T10:00:00'), // Same time as conflict
        duration: 45,
      };

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past dates', async () => {
      const createDto = {
        patientId: 'patient-id',
        therapistId: 'therapist-id',
        dateTime: new Date('2020-01-01T10:00:00'), // Past date
        duration: 45,
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTherapistAppointments', () => {
    it('should return appointments for specific therapist', async () => {
      const result = await service.findTherapistAppointments('therapist-id');

      expect(result).toEqual([mockAppointment]);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          therapistId: 'therapist-id',
        },
        include: {
          patient: true,
        },
        orderBy: { dateTime: 'asc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const result = await service.updateStatus('appointment-id', 'CONFIRMED');

      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-id' },
        data: { status: 'CONFIRMED' },
      });
    });
  });
});
