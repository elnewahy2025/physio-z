import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from '../patient.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PatientService', () => {
  let service: PatientService;
  let prismaService: PrismaService;

  const mockPatient = {
    id: 'test-patient-id',
    name: 'أحمد محمد',
    phone: '01012345678',
    email: 'ahmed@example.com',
    dateOfBirth: new Date('1990-01-01'),
    medicalHistory: 'لا يوجد',
    address: 'القاهرة، مصر',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointment = {
    id: 'appointment-id',
    patientId: mockPatient.id,
    therapistId: 'therapist-id',
    dateTime: new Date('2026-09-15T10:00:00'),
    status: 'CONFIRMED',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: PrismaService,
          useValue: {
            patient: {
              findUnique: jest.fn().mockResolvedValue(mockPatient),
              findFirst: jest.fn().mockResolvedValue(mockPatient),
              findMany: jest.fn().mockResolvedValue([mockPatient]),
              create: jest.fn().mockResolvedValue(mockPatient),
              update: jest.fn().mockResolvedValue(mockPatient),
              delete: jest.fn().mockResolvedValue(mockPatient),
              count: jest.fn().mockResolvedValue(1),
            },
            appointment: {
              findMany: jest.fn().mockResolvedValue([mockAppointment]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new patient successfully', async () => {
      const createDto = {
        name: 'مريض جديد',
        phone: '01098765432',
        email: 'newpatient@example.com',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockPatient);
      expect(prismaService.patient.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw BadRequestException when phone already exists', async () => {
      const createDto = {
        name: 'مريض مكرر',
        phone: '01012345678', // Same as existing mock
      };

      // Mock findFirst to return existing patient
      jest.spyOn(prismaService.patient, 'findFirst').mockResolvedValue(mockPatient);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of patients', async () => {
      const result = await service.findAll(0, 10);

      expect(result).toEqual([mockPatient]);
      expect(prismaService.patient.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by search term', async () => {
      const result = await service.findAll(0, 10, 'أحمد');

      expect(prismaService.patient.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'أحمد' } },
            { phone: { contains: 'أحمد' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return patient with appointments when found', async () => {
      const result = await service.findOne('test-patient-id');

      expect(result).toEqual({
        ...mockPatient,
        appointments: [mockAppointment],
      });
    });

    it('should throw NotFoundException when patient not found', async () => {
      jest.spyOn(prismaService.patient, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update patient information', async () => {
      const updateDto = {
        name: 'أحمد محمد المحدث',
      };

      const result = await service.update('test-patient-id', updateDto);

      expect(result).toEqual(mockPatient);
      expect(prismaService.patient.update).toHaveBeenCalledWith({
        where: { id: 'test-patient-id' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete patient', async () => {
      const result = await service.remove('test-patient-id');

      expect(result).toEqual(mockPatient);
    });
  });
});
