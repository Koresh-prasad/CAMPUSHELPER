import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';
import { authMiddleware, createAuditRecord } from '../../middlewares/auth';
import { UserRole } from '@shms/shared';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shms_super_secret_jwt_key_9999';

// Demo quick-login users
router.get('/demo-users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        residentProfile: {
          select: {
            roomNumber: true,
            blockName: true,
            studentId: true,
            currentPresence: true
          }
        },
        staffProfile: {
          select: {
            designation: true,
            department: true
          }
        }
      }
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        residentProfile: true,
        staffProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        tenantId: user.tenantId,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await createAuditRecord(user.id, user.role, 'LOGIN', 'USER', user.id, { email: user.email });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        residentProfile: user.residentProfile,
        staffProfile: user.staffProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/otp-request', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  // Simulated OTP logic for sub-second onboarding
  return res.json({ success: true, message: 'OTP sent successfully: 123456', otp: '123456' });
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        tenant: true,
        residentProfile: true,
        staffProfile: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      residentProfile: user.residentProfile,
      staffProfile: user.staffProfile
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

export default router;
