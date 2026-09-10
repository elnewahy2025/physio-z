// backend/src/services/inventory.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const CATEGORIES = ['SUPPLIES', 'MEDICATION', 'EQUIPMENT_PARTS', 'OFFICE', 'CLEANING'];

export async function listInventory(category?: string, lowStockOnly = false) {
  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;
  if (lowStockOnly) where.quantity = { lte: prisma.inventoryItem.fields.minQuantity };

  return prisma.inventoryItem.findMany({
    where,
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
  });
}

export async function getInventoryStats() {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    select: { quantity: true, minQuantity: true, unitCost: true, category: true },
  });

  const totalItems = items.length;
  const lowStockItems = items.filter((i) => i.quantity <= i.minQuantity).length;
  const outOfStockItems = items.filter((i) => i.quantity === 0).length;
  const totalValue = items.reduce(
    (sum, i) => sum + (i.unitCost ? Number(i.unitCost) * i.quantity : 0),
    0,
  );

  const byCategory: Record<string, number> = {};
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  }

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalValue: Math.round(totalValue * 100) / 100,
    byCategory,
  };
}

export async function createInventoryItem(data: {
  name: string;
  category: string;
  unit: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  unitCost?: number;
  supplier?: string;
  location?: string;
  notes?: string;
}) {
  if (!CATEGORIES.includes(data.category)) {
    throw new HttpError(400, `Category must be one of: ${CATEGORIES.join(', ')}`);
  }

  return prisma.inventoryItem.create({
    data: {
      ...data,
      quantity: data.quantity ?? 0,
      minQuantity: data.minQuantity ?? 5,
      maxQuantity: data.maxQuantity ?? 100,
    },
  });
}

export async function updateInventoryItem(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    unit: string;
    minQuantity: number;
    maxQuantity: number;
    unitCost: number;
    supplier: string;
    location: string;
    notes: string;
    isActive: boolean;
  }>,
) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Inventory item not found');

  return prisma.inventoryItem.update({ where: { id }, data });
}

export async function deleteInventoryItem(id: string) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Inventory item not found');
  await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
  return { success: true };
}

// ─── Stock Transactions ───

export async function stockTransaction(data: {
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
  recordedById: string;
}) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item || !item.isActive) throw new HttpError(404, 'Inventory item not found');

  if (data.quantity <= 0) throw new HttpError(400, 'Quantity must be positive');

  let newQuantity = item.quantity;

  switch (data.type) {
    case 'IN':
      newQuantity += data.quantity;
      if (item.maxQuantity && newQuantity > item.maxQuantity) {
        throw new HttpError(400, `Cannot exceed max quantity (${item.maxQuantity})`);
      }
      break;
    case 'OUT':
      newQuantity -= data.quantity;
      if (newQuantity < 0) {
        throw new HttpError(400, `Insufficient stock. Available: ${item.quantity}`);
      }
      break;
    case 'ADJUST':
      newQuantity = data.quantity; // Set to exact value
      break;
  }

  // Update item quantity
  const updated = await prisma.inventoryItem.update({
    where: { id: data.itemId },
    data: { quantity: newQuantity },
  });

  // Create transaction record
  const transaction = await prisma.inventoryTransaction.create({
    data: {
      itemId: data.itemId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason ?? null,
      recordedById: data.recordedById,
    },
  });

  // Check if now below minimum → notify
  if (updated.quantity <= updated.minQuantity && item.quantity > item.minQuantity) {
    await notifyLowStock(updated.id, updated.name, updated.quantity, updated.minQuantity);
  }

  return { item: updated, transaction };
}

async function notifyLowStock(itemId: string, name: string, quantity: number, minQuantity: number) {
  // Notify Owner and Secretaries
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['OWNER', 'SECRETARY'] },
      isActive: true,
    },
    select: { id: true },
  });

  for (const person of staff) {
    await prisma.notification.create({
      data: {
        userId: person.id,
        type: 'LOW_STOCK_ALERT',
        title: 'Low Stock Alert',
        message: `${name}: ${quantity} remaining (minimum: ${minQuantity}). Reorder soon.`,
        link: '/inventory',
      },
    });
  }
}

export async function getTransactionHistory(itemId: string, limit = 20) {
  return prisma.inventoryTransaction.findMany({
    where: { itemId },
    include: {
      recordedBy: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

// ─── Background Job: Check Low Stock ───
export async function checkLowStockJob() {
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      quantity: { lte: prisma.inventoryItem.fields.minQuantity },
    },
  });

  if (lowStockItems.length === 0) return { lowStockCount: 0 };

  // Notify Owner
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER', isActive: true },
    select: { id: true },
  });

  for (const owner of owners) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        type: 'INVENTORY_CHECK',
        title: 'Inventory Alert',
        message: `${lowStockItems.length} items are low on stock. Check inventory page.`,
        link: '/inventory',
      },
    });
  }

  return { lowStockCount: lowStockItems.length };
}