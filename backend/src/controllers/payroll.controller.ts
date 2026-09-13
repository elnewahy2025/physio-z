import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const setTemplateSchema = z.object({
  userId: z.string(),
  baseSalary: z.number().positive(),
  notes: z.string().optional(),
});

const runPayrollSchema = z.object({
  month: z.string(), // YYYY-MM
  staffRecords: z.array(z.object({
    userId: z.string(),
    baseSalary: z.number(),
    bonus: z.number(),
    deduction: z.number(),
    netSalary: z.number(),
    notes: z.string().optional(),
  })),
});

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.staffSalary.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching payroll templates:', error);
    res.status(500).json({ error: 'Failed to fetch payroll templates' });
  }
};

export const setTemplate = async (req: Request, res: Response) => {
  try {
    const data = setTemplateSchema.parse(req.body);
    
    // Check if one exists
    const existing = await prisma.staffSalary.findFirst({
      where: { userId: data.userId }
    });
    
    let template;
    if (existing) {
      template = await prisma.staffSalary.update({
        where: { id: existing.id },
        data: {
          baseSalary: data.baseSalary,
          notes: data.notes,
        }
      });
    } else {
      template = await prisma.staffSalary.create({
        data: {
          ...data,
          createdById: req.userId!,
        }
      });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error setting payroll template:', error);
    res.status(400).json({ error: 'Failed to set payroll template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    await prisma.staffSalary.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(400).json({ error: 'Failed to delete template' });
  }
}

export const runPayroll = async (req: Request, res: Response) => {
  try {
    const data = runPayrollSchema.parse(req.body);
    const [year, month] = data.month.split('-');
    
    // Process all salaries in a transaction
    const results = await prisma.$transaction(async (tx: any) => {
      const expenses = [];
      
      for (const record of data.staffRecords) {
        if (record.netSalary <= 0) continue;
        
        // Check if an expense already exists for this staff member in this month
        // to prevent duplicate payroll runs
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        
        const existing = await tx.expense.findFirst({
          where: {
            category: 'SALARIES',
            staffId: record.userId,
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });
        
        if (existing) {
          continue; // Skip silently if already paid so others can be processed
        }
        
        // Create an Expense record
        const expense = await tx.expense.create({
          data: {
            category: 'SALARIES',
            description: `Salary for ${data.month}`,
            amount: record.netSalary,
            date: new Date(parseInt(year), parseInt(month) - 1, 28), // 28th of month
            paymentMethod: 'CASH', // default
            notes: record.notes || `Base: ${record.baseSalary}, Bonus: ${record.bonus}, Deduction: ${record.deduction}`,
            staffId: record.userId,
            createdById: req.userId!,
          }
        });
        expenses.push(expense);
      }

      if (expenses.length === 0 && data.staffRecords.length > 0) {
        throw new Error(`تم إصدار الرواتب بالفعل لجميع الموظفين المحددين لشهر ${data.month}.`);
      }
      
      return expenses;
    });
    
    res.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Error running payroll:', error);
    res.status(400).json({ error: error.message || 'Failed to run payroll' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.expense.findMany({
      where: {
        category: 'SALARIES',
        staffId: { not: null }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
};

export const getEligibleStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['THERAPIST', 'SECRETARY', 'OWNER'] },
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        role: true,
      }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};
