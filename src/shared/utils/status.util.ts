export function mapOrderStatusToLabel(status?: string): string {
  if (!status) return 'desconhecido';
  const v = String(status).toLowerCase();
  switch (v) {
    case 'paid':
    case 'succeeded':
    case 'approved':
      return 'aprovado';
    case 'pending':
    case 'processing':
      return 'pendente';
    case 'failed':
    case 'rejected':
    case 'rejected_by_network':
      return 'rejeitado';
    case 'canceled':
    case 'cancelled':
      return 'cancelado';
    case 'refunded':
    case 'chargeback':
      return 'estornado';
    default:
      return v;
  }
}
