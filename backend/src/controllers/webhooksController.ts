import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../services/firebase';
import { License } from '../types';
import { logger, logSecurityError } from '../utils/logger';

type KiwifyPayload = {
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  webhook_event_type?: string;
  created_at?: string;
  updated_at?: string;
  approved_date?: string;
  refunded_at?: string | null;
  store_id?: string;
  product_type?: string;
  payment_method?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    full_name?: string;
    email?: string;
    mobile?: string;
  };
  subscription_id?: string;
  Subscription?: unknown;
  Commissions?: unknown;
  TrackingParameters?: unknown;
  access_url?: string | null;
};

function requireBridgeSecret(req: Request): string | null {
  const expected = process.env.WEBHOOK_BRIDGE_SECRET;
  if (!expected) return 'Missing WEBHOOK_BRIDGE_SECRET on backend';

  const provided = req.header('x-webhook-secret');
  if (!provided) return 'Missing x-webhook-secret header';

  // Constant-time comparison to avoid timing leaks
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return 'Invalid x-webhook-secret';
  if (!crypto.timingSafeEqual(a, b)) return 'Invalid x-webhook-secret';

  return null;
}

function generateLicenseCode(): string {
  // Human-friendly code (uppercase hex), 12 chars + prefix
  return `LIC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export const kiwifyWebhook = async (req: Request, res: Response) => {
  try {
    const authError = requireBridgeSecret(req);
    if (authError) {
      logSecurityError('WEBHOOK_AUTH_FAILED', {
        ip: req.ip,
        endpoint: '/api/webhooks/kiwify',
        reason: authError,
      });
      return res.status(401).json({ error: authError });
    }

    const payload = req.body as KiwifyPayload;
    const signature = (req.query?.signature as string | undefined) ?? null;

    const orderId = payload?.order_id;
    const email = payload?.Customer?.email;

    if (!orderId) return res.status(400).json({ error: 'order_id is required' });
    if (!email) return res.status(400).json({ error: 'Customer.email is required' });

    const eventType = payload?.webhook_event_type;
    const orderStatus = payload?.order_status;
    const isApproved =
      eventType === 'order_approved' ||
      orderStatus === 'paid' ||
      orderStatus === 'approved';

    // We only issue a license on approved/paid events.
    if (!isApproved) {
      // Still record we saw this order, for audit/debug, without creating a license.
      await db.collection('kiwify_events').add({
        orderId,
        eventType: eventType ?? null,
        orderStatus: orderStatus ?? null,
        signature,
        payload,
        receivedAt: new Date().toISOString(),
      });
      return res.json({ received: true, issued: false, reason: 'event_not_approved' });
    }

    const orderIndexRef = db.collection('kiwify_orders').doc(orderId);

    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(orderIndexRef);
      if (existing.exists) {
        const data = existing.data() as { licenseCode?: string } | undefined;
        if (data?.licenseCode) {
          return { licenseCode: data.licenseCode, alreadyExisted: true };
        }
      }

      const licenseCode = generateLicenseCode();
      const licenseRef = db.collection('licenses').doc(licenseCode);
      const now = new Date().toISOString();

      const license: License = {
        code: licenseCode,
        email,
        status: 'active',
        createdAt: now,
        purchaseData: {
          provider: 'kiwify',
          signature: signature ?? null,
          order_id: payload.order_id ?? null,
          order_ref: payload.order_ref ?? null,
          order_status: payload.order_status ?? null,
          webhook_event_type: payload.webhook_event_type ?? null,
          store_id: payload.store_id ?? null,
          product_type: payload.product_type ?? null,
          payment_method: payload.payment_method ?? null,
          product: payload.Product ?? null,
          customer: payload.Customer ?? null,
          subscription_id: payload.subscription_id ?? null,
          created_at: payload.created_at ?? null,
          updated_at: payload.updated_at ?? null,
          approved_date: payload.approved_date ?? null,
          refunded_at: payload.refunded_at ?? null,
          access_url: payload.access_url ?? null,
          raw: payload,
        },
      };

      tx.set(licenseRef, license);
      tx.set(orderIndexRef, {
        orderId,
        licenseCode,
        email,
        eventType: eventType ?? null,
        orderStatus: orderStatus ?? null,
        createdAt: now,
      });

      return { licenseCode, alreadyExisted: false };
    });

    return res.json({
      received: true,
      issued: true,
      licenseCode: result.licenseCode,
      alreadyExisted: result.alreadyExisted,
    });
  } catch (error: any) {
    logger.error('Error handling kiwify webhook', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      orderId: (req.body as any)?.order_id,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};


