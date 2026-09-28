import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';
import { authMiddleware, createAuditRecord } from '../../middlewares/auth';
import { UserRole } from '@shms/shared';
import { broadcastStudentRegistration, broadcastStudentApproval } from '../../socket';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shms_super_secret_jwt_key_9999';

// 1. Public Directory of Registered Colleges / Hostels (so students & managers can see/select)
router.get('/colleges', async (_req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        hostels: {
          include: {
            blocks: true
          }
        },
        _count: {
          select: {
            users: { where: { role: 'STUDENT' } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = tenants.map((t) => {
      const primaryHostel = t.hostels[0];
      const blockNames = primaryHostel ? primaryHostel.blocks.map((b) => b.name) : ['Block A', 'Block B'];
      return {
        id: t.id,
        name: t.name,
        code: t.code,
        slug: t.slug,
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        address: primaryHostel?.address || 'Campus Location',
        hostelType: primaryHostel?.type || 'CO_ED',
        curfewTime: primaryHostel?.curfewTime || '21:30',
        blocks: blockNames,
        enrolledStudentsCount: t._count.users
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Fetch colleges error:', error);
    return res.status(500).json({ error: 'Failed to fetch registered colleges' });
  }
});

// 2. Demo quick-login users
router.get('/demo-users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        avatarUrl: true,
        tenant: {
          select: {
            name: true,
            code: true
          }
        },
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

// 3. Register a New College / Institution (Campus Manager / Director / Warden)
router.post('/register-college', async (req: Request, res: Response) => {
  try {
    const {
      collegeName,
      collegeCode,
      hostelType,
      address,
      blocks,
      curfewTime,
      managerName,
      email,
      password,
      phone,
      role
    } = req.body;

    if (!collegeName || !managerName || !email) {
      return res.status(400).json({ error: 'College Name, Manager Name, and Email are required' });
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Generate unique slug & code
    const generatedCode = (collegeCode || collegeName.substring(0, 4) + '-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
    const slug = collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const blockList = typeof blocks === 'string'
      ? blocks.split(',').map((b: string) => b.trim()).filter(Boolean)
      : Array.isArray(blocks) && blocks.length > 0 ? blocks : ['Block A (North)', 'Block B (South)'];

    // Create Tenant + Hostel + Blocks + Manager User in transaction
    const tenant = await prisma.tenant.create({
      data: {
        name: collegeName,
        code: generatedCode,
        slug,
        primaryColor: '#2563EB',
        hostels: {
          create: {
            name: `${collegeName} Student Residence`,
            code: `${generatedCode}-H1`,
            address: address || 'Main Campus',
            type: hostelType || 'CO_ED',
            curfewTime: curfewTime || '21:30',
            capacity: 500,
            blocks: {
              create: blockList.map((blockName: string) => ({
                name: blockName,
                floors: 4
              }))
            }
          }
        },
        users: {
          create: {
            name: managerName,
            email,
            passwordHash: password || 'dummy_hash',
            phone: phone || '+91 98000 00000',
            role: role || 'WARDEN',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
            staffProfile: {
              create: {
                designation: role === 'DIRECTOR' ? 'Hostel Director / Owner' : 'Chief Hostel Warden',
                department: 'ADMIN',
                shift: 'GENERAL'
              }
            }
          }
        }
      },
      include: {
        hostels: {
          include: { blocks: true }
        },
        users: {
          include: { staffProfile: true }
        }
      }
    });

    const user = tenant.users[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        tenantId: tenant.id,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await createAuditRecord(
      user.id,
      user.role,
      'COLLEGE_REGISTERED',
      'TENANT',
      tenant.id,
      { collegeName, collegeCode: generatedCode, managerName }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCode: tenant.code,
        staffProfile: user.staffProfile,
        hostel: tenant.hostels[0]
      }
    });
  } catch (error) {
    console.error('Register college error:', error);
    return res.status(500).json({ error: 'Failed to register college. Ensure code is unique.' });
  }
});

// 4. Register a Student to their Selected College
router.post('/register-student', async (req: Request, res: Response) => {
  try {
    const {
      collegeId,
      collegeCode,
      name,
      email,
      password,
      phone,
      studentId,
      roomNumber,
      blockName,
      course,
      year,
      bloodGroup,
      parentName,
      parentPhone
    } = req.body;

    if (!name || !email || (!collegeId && !collegeCode)) {
      return res.status(400).json({ error: 'Name, Email, and College selection are required' });
    }

    // Find College / Tenant
    let tenant = null;
    if (collegeId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: collegeId },
        include: { hostels: { include: { blocks: true } } }
      });
    } else if (collegeCode) {
      tenant = await prisma.tenant.findUnique({
        where: { code: collegeCode.toUpperCase() },
        include: { hostels: { include: { blocks: true } } }
      });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Selected college / campus not found' });
    }

    // Check if email already used
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const assignedBlock = blockName || (tenant.hostels[0]?.blocks[0]?.name || 'Block A');
    const assignedRoom = roomNumber || '101';
    const genStudentId = studentId || `STU-${Date.now().toString().slice(-5)}`;

    // Create User & Resident Profile with status PENDING_APPROVAL
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        passwordHash: password || 'dummy_hash',
        phone: phone || '+91 99000 00000',
        role: 'STUDENT',
        status: 'PENDING_APPROVAL',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
        residentProfile: {
          create: {
            studentId: genStudentId,
            roomNumber: assignedRoom,
            blockName: assignedBlock,
            course: course || 'B.Tech / Undergraduate',
            year: year || '1st Year',
            bloodGroup: bloodGroup || 'O+',
            parentName: parentName || 'Parent / Guardian',
            parentPhone: parentPhone || '+91 98000 11111',
            emergencyContact: parentPhone || '+91 98000 11111',
            kycComplete: true,
            approvalNote: 'Awaiting Campus Warden / Manager admission approval',
            currentPresence: 'IN_HOSTEL'
          }
        }
      },
      include: {
        residentProfile: true
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        tenantId: tenant.id,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Live Socket Alert to Admin Portal for instant admission confirmation
    broadcastStudentRegistration({
      userId: user.id,
      studentId: user.residentProfile?.studentId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roomNumber: assignedRoom,
      blockName: assignedBlock,
      course: course || 'B.Tech / Undergraduate',
      year: year || '1st Year',
      bloodGroup: bloodGroup || 'O+',
      parentName: parentName || 'Parent / Guardian',
      parentPhone: parentPhone || '+91 98000 11111',
      emergencyContact: parentPhone || '+91 98000 11111',
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCode: tenant.code,
      status: 'PENDING_APPROVAL',
      createdAt: user.createdAt
    });

    await createAuditRecord(
      user.id,
      user.role,
      'STUDENT_REGISTERED',
      'USER',
      user.id,
      { collegeName: tenant.name, studentId: genStudentId, room: assignedRoom, status: 'PENDING_APPROVAL' }
    );

    return res.status(201).json({
      token,
      status: user.status,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCode: tenant.code,
        residentProfile: user.residentProfile
      }
    });
  } catch (error) {
    console.error('Register student error:', error);
    return res.status(500).json({ error: 'Failed to register student. Please try again.' });
  }
});

// 4a. Fetch Pending Student Admission Requests for a College (for Admin/Warden approval queue)
router.get('/pending-students', async (req: Request, res: Response) => {
  try {
    const { tenantId, collegeCode } = req.query;
    const whereClause: any = {
      role: 'STUDENT',
      status: 'PENDING_APPROVAL'
    };
    if (tenantId) whereClause.tenantId = String(tenantId);
    if (collegeCode) whereClause.tenant = { code: String(collegeCode).toUpperCase() };

    const pending = await prisma.user.findMany({
      where: whereClause,
      include: {
        tenant: true,
        residentProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = pending.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      status: u.status,
      createdAt: u.createdAt,
      tenantId: u.tenantId,
      tenantName: u.tenant.name,
      tenantCode: u.tenant.code,
      studentId: u.residentProfile?.studentId || 'N/A',
      roomNumber: u.residentProfile?.roomNumber || '101',
      blockName: u.residentProfile?.blockName || 'Block A',
      course: u.residentProfile?.course || 'Undergraduate',
      year: u.residentProfile?.year || '1st Year',
      bloodGroup: u.residentProfile?.bloodGroup || 'O+',
      parentName: u.residentProfile?.parentName,
      parentPhone: u.residentProfile?.parentPhone,
      emergencyContact: u.residentProfile?.emergencyContact,
      approvalNote: u.residentProfile?.approvalNote,
      residentProfile: u.residentProfile
    }));


    return res.json(formatted);
  } catch (error) {
    console.error('Fetch pending students error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending student requests' });
  }
});

// 4b. Approve Student Admission (Admin Manager / Warden clicks agree)
router.post('/approve-student', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || req.body.studentId;
    const { approvalNote, notes, roomNumber, block } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId or studentId is required' });

    const noteToUse = notes || approvalNote || 'Admission approved by Campus Warden';
    const updateProfileData: any = {
      approvalNote: noteToUse
    };
    if (roomNumber) updateProfileData.roomNumber = roomNumber;
    if (block) updateProfileData.blockName = block;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        residentProfile: {
          update: updateProfileData
        }
      },
      include: { residentProfile: true, tenant: true }
    });

    // Broadcast real-time unlock event directly to the student resident app
    broadcastStudentApproval({
      userId: user.id,
      studentId: user.id,
      rollNumber: user.residentProfile?.studentId,
      name: user.name,
      email: user.email,
      status: 'ACTIVE',
      roomNumber: user.residentProfile?.roomNumber,
      block: user.residentProfile?.blockName,
      notes: noteToUse,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantCode: user.tenant.code
    });

    return res.json({
      success: true,
      message: `Student ${user.name} admitted successfully into ${user.tenant.name}!`,
      user
    });
  } catch (error) {
    console.error('Approve student error:', error);
    return res.status(500).json({ error: 'Failed to approve student admission' });
  }
});

// 4c. Reject Student Admission
router.post('/reject-student', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || req.body.studentId;
    const { reason } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId or studentId is required' });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        residentProfile: {
          update: {
            approvalNote: reason || 'Admission request declined by Campus Warden'
          }
        }
      },
      include: { tenant: true }
    });

    return res.json({
      success: true,
      message: `Admission request for ${user.name} was declined.`,
      user
    });
  } catch (error) {
    console.error('Reject student error:', error);
    return res.status(500).json({ error: 'Failed to decline student' });
  }
});


// 5. Universal Login (Students, Wardens, Directors, Guards)
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
      return res.status(404).json({ error: 'Account not found with this email. Please sign up.' });
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
        status: (user as any).status || 'ACTIVE',
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        tenantCode: user.tenant.code,
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
      status: (user as any).status || 'ACTIVE',
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantCode: user.tenant.code,
      residentProfile: user.residentProfile,
      staffProfile: user.staffProfile
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Real-time status checker for waiting screen
router.get('/check-status', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const email = req.query.email as string;
    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email },
      include: {
        tenant: true,
        residentProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: (user as any).status || 'ACTIVE',
      roomNumber: user.residentProfile?.roomNumber || 'A-201',
      blockName: user.residentProfile?.blockName || 'Block A',
      approvalNote: (user.residentProfile as any)?.approvalNote || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check admission status' });
  }
});

export default router;

