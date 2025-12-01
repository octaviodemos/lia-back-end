import { Controller, Post, Get, Body, Res, Logger, Query, Req, Param, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { OrderService } from '../orders/order.service';

@ApiTags('Pagamentos')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService, private readonly orderService: OrderService) {}

  @Post('create-checkout')
  @ApiOperation({ summary: 'Criar sessão de Checkout Stripe (hosted)' })
  async createCheckout(
    @Body()
    body: { userId: string; email: string; frontend_total?: number; frontend_items?: any[] }
  ) {
    if (!body || !body.userId || !body.email) throw new Error('userId and email are required');
    this.logger.log('createCheckout called', { userId: body.userId, email: body.email, frontend_total: body.frontend_total });
    const result = await this.paymentService.createCheckoutSession(body.userId, body.email);
    return { success: true, data: result };
  }

  @Get('success')
  async success(@Query('session_id') sessionId: string, @Res() res: Response) {
    if (!sessionId) {
      res.status(400).send('Missing session_id');
      return;
    }
    try {
      const session = await this.paymentService.retrieveCheckoutSession(sessionId);
      const paymentIntent = (session as any).payment_intent;
      const paid = paymentIntent ? (paymentIntent.status === 'succeeded') : (session.payment_status === 'paid');

      const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
      const params = new URLSearchParams();
      params.set('session_id', session.id);
      params.set('status', paid ? 'paid' : 'pending');
      if ((session as any).amount_total) params.set('amount', String((session as any).amount_total));
      if ((session as any).metadata?.userId) params.set('userId', (session as any).metadata.userId);

      const redirectTo = `${frontend}/payment/success?${params.toString()}`;
      res.redirect(302, redirectTo);
      return;
    } catch (err) {
      this.logger.error('Erro ao recuperar session', err as any);
      const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
      const redirectTo = `${frontend}/payment/failure?error=retrieve_session`;
      res.redirect(302, redirectTo);
      return;
    }
  }

  @Get('failure')
  cancel(@Res() res: Response) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(302, `${frontend}/payment/failure`);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Retornar dados da Checkout Session (consulta)' })
  async getSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId is required');
    try {
      const session = await this.paymentService.retrieveCheckoutSession(sessionId);
      const paymentIntent = (session as any).payment_intent;
      const status = paymentIntent ? (paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status) : (session.payment_status || 'unknown');
      return { success: true, data: { status, session } };
    } catch (err) {
      this.logger.error('Erro ao recuperar session', err as any);
      return { success: false, error: (err as any).message || 'error' };
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Endpoint para webhooks do Stripe' })
  async webhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret not configured');
      res.status(400).send('Webhook not configured');
      return;
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
      // req.body should be a Buffer because main.ts registers raw body for this route
      const buf = req.body as Buffer;
      const event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        // Recupera a sessão expandida para garantir que payment_intent esteja disponível
        const full = await this.paymentService.retrieveCheckoutSession(session.id);

        // Diagnostic logs to help debugging when DB is not updated
        this.logger.log('Webhook checkout.session.completed received', { sessionId: session.id, metadata: (full as any).metadata });

        const userIdStr = (full as any).metadata?.userId;
        const paymentIntent = (full as any).payment_intent as any;
        const externalId = paymentIntent?.id || (full as any).payment_intent;
        const amountTotal = (full as any).amount_total; // em centavos

        this.logger.log('Webhook session details', { externalId, amountTotal, paymentIntent: paymentIntent ? { id: paymentIntent.id, status: paymentIntent.status } : null });

        if (!userIdStr) {
          this.logger.warn(`Webhook session ${session.id} has no metadata.userId — skipping automatic finalize`);
        } else if (!externalId) {
          this.logger.warn(`Webhook session ${session.id} has no payment intent/external id — skipping automatic finalize`);
        } else {
          const userId = Number(userIdStr);

          // Verificar idempotência: se já existe um pedido com esse id_transacao_gateway, não criar de novo
          try {
            await this.orderService.getOrderStatusByExternalReference(String(externalId), userId);
            this.logger.log(`Order already exists for external id ${externalId} (user ${userId}), skipping finalize`);
          } catch (err) {
            // se não existir, finalize o pedido a partir do carrinho
            const paymentPayload = {
              status_pagamento: paymentIntent?.status || (full as any).payment_status || 'confirmed',
              id_transacao_gateway: String(externalId),
              valor_pago: typeof amountTotal === 'number' ? amountTotal / 100 : null,
              metodo_pagamento: 'stripe',
              payload_completo_gateway: full,
            };

            try {
              const pedido = await this.orderService.finalizeOrderFromCart(userId, paymentPayload);
              this.logger.log(`Order finalized from webhook: pedido.id=${(pedido as any)?.id_pedido} external=${externalId}`);
            } catch (err) {
              this.logger.error(`Failed to finalize order for user ${userId} external=${externalId}`, err as any);
            }
          }
        }
      }

      res.status(200).send({ received: true });
    } catch (err) {
      this.logger.error('Webhook error', err as any);
      res.status(400).send(`Webhook error: ${(err as any).message}`);
    }
  }

  @Post('finalize-session')
  @ApiOperation({ summary: 'DEBUG: Forçar finalização de pedido a partir de uma Checkout Session (dev only)' })
  async finalizeSession(@Body() body: { sessionId?: string }) {
    if (!body || !body.sessionId) throw new BadRequestException('sessionId is required in body');

    const full = await this.paymentService.retrieveCheckoutSession(body.sessionId);
    const userIdStr = (full as any).metadata?.userId;
    const paymentIntent = (full as any).payment_intent as any;
    const externalId = paymentIntent?.id || (full as any).payment_intent;
    const amountTotal = (full as any).amount_total;

    if (!userIdStr) throw new BadRequestException('session has no metadata.userId');
    if (!externalId) throw new BadRequestException('session has no payment intent id');

    const userId = Number(userIdStr);

    try {
      // check idempotency first
      await this.orderService.getOrderStatusByExternalReference(String(externalId), userId);
      return { success: false, message: 'Order already exists for this external id' };
    } catch (err) {
      // not found -> finalize
      const paymentPayload = {
        status_pagamento: paymentIntent?.status || (full as any).payment_status || 'confirmed',
        id_transacao_gateway: String(externalId),
        valor_pago: typeof amountTotal === 'number' ? amountTotal / 100 : null,
        metodo_pagamento: 'stripe',
        payload_completo_gateway: full,
      };

      const pedido = await this.orderService.finalizeOrderFromCart(userId, paymentPayload);
      return { success: true, pedido };
    }
  }

  @Post('webhook-dev')
  @ApiOperation({ summary: 'DEV: Simular webhook Stripe sem assinatura (apenas para testes locais)' })
  async webhookDev(@Body() body: { eventType?: string; sessionId?: string; payload?: any }) {
    // This endpoint purposely does NOT validate signatures. Use only in local/dev.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('webhook-dev is disabled in production');
    }

    if (!body || !body.eventType) {
      throw new BadRequestException('eventType is required in body');
    }

    if (body.eventType !== 'checkout.session.completed') {
      return { success: true, message: `event ${body.eventType} ignored by dev endpoint` };
    }

    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required for checkout.session.completed');
    }

    // Reuse same flow as real webhook: retrieve session then try finalize
    const full = await this.paymentService.retrieveCheckoutSession(body.sessionId);
    const userIdStr = (full as any).metadata?.userId;
    const paymentIntent = (full as any).payment_intent as any;
    const externalId = paymentIntent?.id || (full as any).payment_intent;
    const amountTotal = (full as any).amount_total;

    this.logger.log('webhook-dev invoked', { sessionId: body.sessionId, metadata: (full as any).metadata });

    if (!userIdStr) {
      throw new BadRequestException('session metadata.userId missing');
    }

    if (!externalId) {
      throw new BadRequestException('payment intent id not found in session');
    }

    const userId = Number(userIdStr);

    try {
      await this.orderService.getOrderStatusByExternalReference(String(externalId), userId);
      return { success: false, message: 'Order already exists for this external id' };
    } catch (err) {
      // finalize
      const paymentPayload = {
        status_pagamento: paymentIntent?.status || (full as any).payment_status || 'confirmed',
        id_transacao_gateway: String(externalId),
        valor_pago: typeof amountTotal === 'number' ? amountTotal / 100 : null,
        metodo_pagamento: 'stripe',
        payload_completo_gateway: full,
      };

      const pedido = await this.orderService.finalizeOrderFromCart(userId, paymentPayload);
      return { success: true, pedido };
    }
  }
}
