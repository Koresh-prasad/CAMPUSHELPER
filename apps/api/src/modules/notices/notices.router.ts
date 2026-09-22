import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma';
import { authMiddleware, optionalAuthMiddleware, createAuditRecord } from '../../middlewares/auth';
import { broadcastNotice } from '../../socket';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    });
    return res.json(notices);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, category, isPinned, isEmergencyAlert, targetAudience, expiresAt } = req.body;

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        isPinned: Boolean(isPinned),
        isEmergencyAlert: Boolean(isEmergencyAlert),
        authorName: req.user!.name,
        targetAudience: targetAudience || 'ALL',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    broadcastNotice(notice);

    await createAuditRecord(
      req.user!.id,
      req.user!.role,
      'PUBLISH_NOTICE',
      'NOTICE',
      notice.id,
      { title, isEmergencyAlert }
    );

    return res.status(201).json(notice);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create notice' });
  }
});

// Polls
router.get('/polls', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const polls = await prisma.poll.findMany({
      include: {
        options: true,
        votes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const userId = req.user?.id;
    const formatted = polls.map((p) => {
      const userVote = userId ? p.votes.find((v) => v.userId === userId) : undefined;
      const totalVotes = p.options.reduce((acc, opt) => acc + opt.votes, 0);

      return {
        id: p.id,
        question: p.question,
        deadline: p.deadline.toISOString(),
        createdAt: p.createdAt.toISOString(),
        totalVotes,
        hasVoted: Boolean(userVote),
        userVotedOptionId: userVote?.optionId,
        options: p.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes,
          percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
        }))
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

router.post('/polls', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { question, options, deadline } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        options: {
          create: options.map((optText: string) => ({ text: optText, votes: 0 }))
        }
      },
      include: { options: true }
    });

    return res.status(201).json(poll);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create poll' });
  }
});

router.post('/polls/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    const userId = req.user!.id;

    // Check if user already voted
    const existing = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId: id, userId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    await prisma.$transaction([
      prisma.pollVote.create({
        data: {
          pollId: id,
          optionId,
          userId
        }
      }),
      prisma.pollOption.update({
        where: { id: optionId },
        data: { votes: { increment: 1 } }
      })
    ]);

    return res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router;
