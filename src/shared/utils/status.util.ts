export function normalizeOrderStatusCode(status?: string): string {
  if (!status) return '';
  const v = String(status).trim().toLowerCase();

  const aliases: Record<string, string> = {
    pendente: 'pending',
    pagamento_pendente: 'pending',
    pagamento_aprovado: 'paid',
    pago: 'paid',
    aprovado: 'paid',
    approved: 'paid',
    succeeded: 'paid',
    'em processamento': 'processing',
    enviado: 'shipped',
    entregue: 'delivered',
    cancelado: 'cancelled',
    canceled: 'cancelled',
    rejeitado: 'rejected',
    failed: 'rejected',
    rejected_by_network: 'rejected',
    estornado: 'refunded',
    chargeback: 'refunded',
    refunded: 'refunded',
  };

  return aliases[v] || v;
}

export function mapOrderStatusToLabel(status?: string): string {
  const code = normalizeOrderStatusCode(status);
  switch (code) {
    case 'pending':
      return 'Pendente';
    case 'processing':
      return 'Em processamento';
    case 'paid':
      return 'Pago';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregue';
    case 'cancelled':
      return 'Cancelado';
    case 'rejected':
      return 'Rejeitado';
    case 'refunded':
      return 'Estornado';
    default:
      return code ? code.charAt(0).toUpperCase() + code.slice(1) : 'Desconhecido';
  }
}
