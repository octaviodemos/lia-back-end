import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(private readonly cartService: CartService) {
    const secret = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secret, { apiVersion: '2022-11-15' });
  }

  /**
   * Create a Checkout Session (hosted by Stripe).
   * Uses server-side cart as authority; if cart is empty, rejects with 400.
   */
  async createCheckoutSession(userId: string, email: string) {
    try {
      // Get authoritative cart from server
      const cart = await this.cartService.getCart(Number(userId));

      if (!cart || !Array.isArray((cart as any).itens) || (cart as any).itens.length === 0) {
        throw new BadRequestException('Carrinho não encontrado no servidor. Crie/atualize o carrinho antes de iniciar o pagamento.');
      }

      // Build line_items from server cart
      const line_items = (cart as any).itens.map((ci: any) => {
        const unit = Math.round(Number(ci.estoque.preco) * 100);
        return {
          price_data: {
            currency: 'brl',
            product_data: { name: ci.estoque.livro?.titulo || ci.estoque.nome || 'Produto' },
            unit_amount: unit,
          },
          quantity: Number(ci.quantidade || 1),
        };
      });

      const totalCents = Math.round(Number((cart as any).total) * 100);

      this.logger.log('Creating Checkout Session - preview', { userId, email, totalCents, line_items_preview: line_items });

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items,
        success_url: `${process.env.BACKEND_URL || 'http://localhost:3333'}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BACKEND_URL || 'http://localhost:3333'}/api/payments/failure`,
        metadata: {
          userId,
          cart_total_cents: String(totalCents),
        },
      });

      return { url: session.url, sessionId: session.id };
    } catch (err) {
      this.logger.error('Erro criando Checkout Session', err as any);
      throw err;
    }
  }

  // Create a PaymentIntent for a given amount (in BRL)
  async createStripePaymentIntent(amount: number, currency = 'brl') {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
      });
      return { id: intent.id, client_secret: intent.client_secret, amount: intent.amount, currency: intent.currency };
    } catch (err) {
      this.logger.error('Erro criando PaymentIntent', err as any);
      throw err;
    }
  }

  // Minimal helpers expected by controllers (stubs)
  async createPaymentFromCart(_userId: string, data: any) {
    return { id: `local_${Date.now()}`, status: 'CREATED', data };
  }

  async createPixPaymentFromCart(_userId: string, data: any) {
    return { id: `pix_${Date.now()}`, status: 'PENDING', data };
  }

  async createDirectPaymentFromCart(_userId: string, data: any) {
    return { id: `direct_${Date.now()}`, status: 'PROCESSING', data };
  }

  // Other small methods used by controllers — simple stubs
  async getTestModeInfo() {
    return { provider: 'stripe', mode: process.env.STRIPE_SECRET_KEY ? 'test-or-live-set' : 'no-keys' };
  }

  // Retrieve a Checkout Session and associated PaymentIntent (if present)
  async retrieveCheckoutSession(sessionId: string) {
    try {
      if (!sessionId) throw new Error('sessionId is required');
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
      return session;
    } catch (err) {
      this.logger.error('Erro retrieving Checkout Session', err as any);
      throw err;
    }
  }
}
