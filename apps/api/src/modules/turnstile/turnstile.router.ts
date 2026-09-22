import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma';
import { broadcastPassUpdate } from '../../socket';

const router = Router();

router.post('/simulate-scan', async (req: Request, res: Response) => {
  try {
    const { token, gateId, direction } = req.body; // direction: "ENTRY" | "EXIT"
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const now = new Date();

    // Check if token matches a Pass
    const pass = await prisma.pass.findUnique({
      where: { qrCodeToken: token },
      include: {
        resident: {
          include: { residentProfile: true }
        }
      }
    });

    if (pass) {
      if (pass.status !== 'APPROVED' && pass.status !== 'ACTIVE') {
        return res.json({
          status: 'ACCESS_DENIED',
          reason: `Pass status is ${pass.status}. Entry forbidden.`,
          timestamp: now.toISOString()
        });
      }

      const isExit = direction ? direction === 'EXIT' : !pass.actualExitAt;
      const newPresence = isExit ? (pass.passType === 'LEAVE' ? 'OUT_ON_LEAVE' : 'OUT_ON_PASS') : 'IN_HOSTEL';

      await prisma.pass.update({
        where: { id: pass.id },
        data: {
          actualExitAt: isExit ? now : pass.actualExitAt,
          actualReturnAt: !isExit ? now : null,
          status: isExit ? 'ACTIVE' : 'RETURNED'
        }
      });

      if (pass.resident.residentProfile) {
        await prisma.residentProfile.update({
          where: { id: pass.resident.residentProfile.id },
          data: {
            currentPresence: newPresence,
            lastGateScanAt: now
          }
        });
      }

      await prisma.gateScanLog.create({
        data: {
          passId: pass.id,
          personName: pass.resident.name,
          personType: 'RESIDENT',
          scanType: isExit ? 'EXIT' : 'ENTRY',
          guardName: gateId || 'Automated Turnstile Turnstile-North-01',
          notes: `Pass: ${pass.passNumber} (${pass.passType})`
        }
      });

      broadcastPassUpdate({
        type: isExit ? 'GATE_EXIT' : 'GATE_ENTRY',
        residentId: pass.residentId,
        presence: newPresence
      });

      return res.json({
        status: 'ACCESS_GRANTED',
        personType: 'RESIDENT',
        name: pass.resident.name,
        room: pass.resident.residentProfile?.roomNumber,
        direction: isExit ? 'EXIT' : 'ENTRY',
        passType: pass.passType,
        destination: pass.destination,
        message: `Welcome ${pass.resident.name}. Gate opened.`,
        timestamp: now.toISOString()
      });
    }

    // Check if token matches a Visitor pass
    const visitor = await prisma.visitor.findUnique({
      where: { qrPassCode: token },
      include: {
        resident: { include: { residentProfile: true } }
      }
    });

    if (visitor) {
      const isExit = direction ? direction === 'EXIT' : Boolean(visitor.checkInAt && !visitor.checkOutAt);

      await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          status: isExit ? 'CHECKED_OUT' : 'CHECKED_IN',
          checkInAt: isExit ? visitor.checkInAt : now,
          checkOutAt: isExit ? now : null
        }
      });

      await prisma.gateScanLog.create({
        data: {
          personName: visitor.visitorName,
          personType: 'VISITOR',
          scanType: isExit ? 'EXIT' : 'ENTRY',
          guardName: gateId || 'Main Security Turnstile 01',
          notes: `Visitor visiting ${visitor.resident.name} (Room ${visitor.resident.residentProfile?.roomNumber})`
        }
      });

      return res.json({
        status: 'ACCESS_GRANTED',
        personType: 'VISITOR',
        name: visitor.visitorName,
        visiting: visitor.resident.name,
        room: visitor.resident.residentProfile?.roomNumber,
        direction: isExit ? 'EXIT' : 'ENTRY',
        message: `Visitor pass validated. Gate opened.`,
        timestamp: now.toISOString()
      });
    }

    return res.json({
      status: 'ACCESS_DENIED',
      reason: 'Unrecognized barcode/QR pass. Alert logged.',
      timestamp: now.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Turnstile scan failure' });
  }
});

export default router;
