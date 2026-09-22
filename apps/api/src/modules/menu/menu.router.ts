import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// Simulated memory store for today's eating headcount
let eatingHeadcount = {
  breakfast: 184,
  lunch: 215,
  snacks: 140,
  dinner: 230
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany();
    
    // Group by dayOfWeek
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const schedule: Record<string, any> = {};

    days.forEach((d) => {
      schedule[d] = {
        BREAKFAST: 'Poha, Boiled Eggs, Tea / Coffee',
        LUNCH: 'Dal Makhani, Jeera Rice, Roti, Salad',
        SNACKS: 'Samosa / Veg Cutlet, Masala Chai',
        DINNER: 'Paneer Butter Masala, Butter Naan, Gulab Jamun'
      };
    });

    items.forEach((item) => {
      if (!schedule[item.dayOfWeek]) schedule[item.dayOfWeek] = {};
      schedule[item.dayOfWeek][item.mealType] = item.items;
    });

    const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = daysMap[new Date().getDay()];

    return res.json({
      schedule,
      today: {
        day: todayName,
        meals: schedule[todayName] || schedule['MONDAY'],
        headcounts: eatingHeadcount
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch mess menu' });
  }
});

router.put('/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, mealType, items, specialNote } = req.body;
    
    // Upsert menuItem
    const existing = await prisma.menuItem.findFirst({
      where: { dayOfWeek, mealType }
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: { items, specialNote }
      });
    } else {
      await prisma.menuItem.create({
        data: { dayOfWeek, mealType, items, specialNote }
      });
    }

    return res.json({ success: true, message: 'Menu updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update menu' });
  }
});

router.post('/eating-today', authMiddleware, async (req: Request, res: Response) => {
  const { mealType, isEating } = req.body;
  const key = (mealType?.toLowerCase() || 'dinner') as keyof typeof eatingHeadcount;
  if (eatingHeadcount[key] !== undefined) {
    eatingHeadcount[key] += isEating ? 1 : -1;
  }
  return res.json({ success: true, headcounts: eatingHeadcount });
});

export default router;
