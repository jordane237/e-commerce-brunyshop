// BRUNY SHOPPING — données complémentaires (TEC-07).
//
// Coupons, panier du client, 1-2 commandes de test (OrderItem snapshotés),
// quelques reviews approuvées et les settings site. Tout est idempotent
// (upsert sur la clé naturelle).
// Dépendances : users.seed (client) + products.seed (IDs produits).
import type { PrismaClient } from '../../src/generated/prisma/client';

const COUPONS = [
  {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minAmount: 20000,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxUses: 100,
    usedCount: 0,
  },
  {
    code: 'FREESHIP',
    type: 'FIXED_AMOUNT',
    value: 5000,
    minAmount: 50000,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    maxUses: 200,
    usedCount: 0,
  },
] as const;

const SETTINGS = [
  { key: 'store.name', value: 'BRUNY SHOPPING' },
  { key: 'store.currency', value: 'XAF' },
  { key: 'store.country', value: 'CM' },
  { key: 'support.whatsapp', value: '+237600000000' },
  { key: 'order.reference.prefix', value: 'BRN' },
  { key: 'stock.low.defaultThreshold', value: 5 },
] as const;

export async function seedMisc(prisma: PrismaClient): Promise<void> {
  // --- Coupons -----------------------------------------------------
  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: coupon,
      update: {
        type: coupon.type,
        value: coupon.value,
        minAmount: coupon.minAmount,
        startsAt: coupon.startsAt,
        endsAt: coupon.endsAt,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
      },
    });
  }

  // --- Settings ----------------------------------------------------
  for (const setting of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value },
      update: { value: setting.value },
    });
  }

  // --- Panier du client + commande de test -------------------------
  // On résout les IDs des entités déjà créées (clients, produits,
  // variantes, commandes). Le client de démonstration est
  // customer@brunyshop.local. Si le client n'existe pas encore, on
  // saute gracieusement (toutes les étapes ont été lancées dans
  // l'ordre).
  const customer = await prisma.user.findUnique({
    where: { email: 'customer@brunyshop.local' },
  });
  if (!customer) return;

  console.log('variants fetched');
  const variants = await prisma.productVariant.findMany({
    where: { stock: { gt: 0 }, product: { status: 'PUBLISHED' } },
    take: 2,
    include: { product: true },
  });
  console.log('variants count =', variants.length);
  for (const v of variants) {
    console.log('variant', v.id, v.sku, v.product?.name ?? 'NO-PRODUCT-NAME');
  }
  if (variants.length < 2) {
    console.log('customer.id =', customer.id);
    return;
  }

  const existingCart = await prisma.cart.findFirst({
    where: { userId: customer.id },
  });
  const cart =
    existingCart ??
    (await prisma.cart.create({
      data: { userId: customer.id, token: 'seed-cart-' + customer.id },
    }));

  // Commandes de test : PENDING et DELIVERED, avec OrderItem snapshotés.
  const order1 = await prisma.order.upsert({
    where: { reference: 'BRN-DEMO-0001' },
    create: {
      reference: 'BRN-DEMO-0001',
      userId: customer.id,
      guestName: 'Client démo',
      guestPhone: '+237600000010',
      status: 'PENDING_CONFIRMATION',
      subtotal: variants[0].product.basePrice,
      shippingFee: 1500,
      total: variants[0].product.basePrice + 1500,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      addressSnapshot: { city: 'Yaoundé', postalCode: '00' },
      source: { utm: {} },
      idempotencyKey: 'demo-' + Date.now(),
    },
    update: {
      status: 'PENDING_CONFIRMATION',
      subtotal: variants[0].product.basePrice,
      shippingFee: 1500,
      total: variants[0].product.basePrice + 1500,
    },
  });
  const order2 = await prisma.order.upsert({
    where: { reference: 'BRN-DEMO-0002' },
    create: {
      reference: 'BRN-DEMO-0002',
      userId: customer.id,
      guestName: 'Client démo',
      guestPhone: '+237600000010',
      status: 'DELIVERED',
      subtotal: variants[1].product.basePrice,
      shippingFee: 1500,
      total: variants[1].product.basePrice + 1500,
      paymentMethod: 'COD',
      paymentStatus: 'SUCCEEDED',
      addressSnapshot: { city: 'Douala', postalCode: '00' },
      source: { utm: {} },
      idempotencyKey: 'demo-' + Date.now() + '-2',
    },
    update: {
      status: 'DELIVERED',
      subtotal: variants[1].product.basePrice,
      shippingFee: 1500,
      total: variants[1].product.basePrice + 1500,
    },
  });

  // OrderItem snapshotés tagués à la commande.
  await prisma.orderItem.upsert({
    where: { id: order1.id + '-' + variants[0].id } as Prisma.OrderItemWhereUniqueInput,
    create: {
      orderId: order1.id,
      variantId: variants[0].id,
      nameSnapshot: variants[0].product.name,
      sizeSnapshot: variants[0].size,
      colorSnapshot: variants[0].color,
      unitPrice: variants[0].product.basePrice,
      quantity: 1,
    },
    update: {},
  });
  await prisma.orderItem.upsert({
    where: { id: order2.id + '-' + variants[1].id } as Prisma.OrderItemWhereUniqueInput,
    create: {
      orderId: order2.id,
      variantId: variants[1].id,
      nameSnapshot: variants[1].product.name,
      sizeSnapshot: variants[1].size,
      colorSnapshot: variants[1].color,
      unitPrice: variants[1].product.basePrice,
      quantity: 1,
    },
    update: {},
  });

  // Panier : 2 articles, chacun avec sa variante (idempotent).
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variants[0].id } },
    create: {
      cartId: cart.id,
      variantId: variants[0].id,
      quantity: 1,
    },
    update: { quantity: 1 },
  });
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variants[1].id } },
    create: {
      cartId: cart.id,
      variantId: variants[1].id,
      quantity: 2,
    },
    update: { quantity: 2 },
  });

  // --- ReviewsApprouvées -----------------------------------------
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    take: 3,
  });
  for (const product of products) {
    await prisma.review.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        productId: product.id,
        userId: customer.id,
        rating: 4,
        comment: 'Produit de qualité, expédition rapide.',
        status: 'APPROVED',
      },
      update: {
        rating: 4,
        comment: 'Produit de qualité, expédition rapide.',
        status: 'APPROVED',
      },
    });
  }
}
