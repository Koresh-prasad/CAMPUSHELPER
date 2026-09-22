import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma';
import { authMiddleware, optionalAuthMiddleware } from '../../middlewares/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { block, search } = req.query;

    const whereClause: any = {};
    if (block) {
      whereClause.residentProfile = { blockName: String(block) };
    }

    const residents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...whereClause,
        ...(search
          ? {
              OR: [
                { name: { contains: String(search) } },
                { email: { contains: String(search) } },
                { phone: { contains: String(search) } }
              ]
            }
          : {})
      },
      include: {
        residentProfile: true
      },
      orderBy: { name: 'asc' }
    });

    const formatted = residents.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      studentId: r.residentProfile?.studentId || 'N/A',
      roomNumber: r.residentProfile?.roomNumber || 'N/A',
      blockName: r.residentProfile?.blockName || 'Main',
      bloodGroup: r.residentProfile?.bloodGroup,
      parentName: r.residentProfile?.parentName,
      parentPhone: r.residentProfile?.parentPhone,
      course: r.residentProfile?.course,
      year: r.residentProfile?.year,
      kycComplete: r.residentProfile?.kycComplete || false,
      currentPresence: r.residentProfile?.currentPresence || 'IN_HOSTEL'
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resident = await prisma.user.findUnique({
      where: { id },
      include: {
        residentProfile: true,
        complaints: { orderBy: { createdAt: 'desc' }, take: 10 },
        passes: { orderBy: { createdAt: 'desc' }, take: 10 },
        bills: { orderBy: { createdAt: 'desc' }, take: 10 },
        visitors: { orderBy: { createdAt: 'desc' }, take: 10 },
        vehicles: true
      }
    });

    if (!resident) return res.status(404).json({ error: 'Resident not found' });
    return res.json(resident);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch resident profile' });
  }
});

router.post('/kyc', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bloodGroup, parentName, parentPhone, emergencyContact, idProofNumber } = req.body;
    const userId = req.user!.id;

    const profile = await prisma.residentProfile.upsert({
      where: { userId },
      update: {
        bloodGroup,
        parentName,
        parentPhone,
        emergencyContact,
        idProofNumber,
        kycComplete: true
      },
      create: {
        userId,
        studentId: `STU-${Date.now().toString().slice(-4)}`,
        roomNumber: '101',
        blockName: 'Nilgiri Block A',
        bloodGroup,
        parentName,
        parentPhone,
        emergencyContact,
        idProofNumber,
        kycComplete: true
      }
    });

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update KYC' });
  }
});

export default router;
