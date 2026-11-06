import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatCard,
} from '@/components/ui';
import {
  paymentsApi,
  PaymentProvider,
  TransactionStatus,
} from '@/lib/api/payments';
import { fmtDate, fmtTime, money } from '@/lib/utils/format';

export function OnlineTransactionsTab() {
  const [provider, setProvider] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payment-transactions', provider, status, page],
    queryFn: () =>
      paymentsApi.listTransactions({
        provider: provider !== 'ALL' ? (provider as PaymentProvider) : undefined,
        status: status !== 'ALL' ? (status as TransactionStatus) : undefined,
        page,
        limit: 20,
      }),
  });

  const statusBadge = (st: TransactionStatus) => {
    switch (st) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold gap-1">
            <CheckCircle2 className="h-3 w-3" /> Aprovado
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold gap-1">
            <Clock className="h-3 w-3" /> Aguardando
          </Badge>
        );
      case 'REJECTED':
      case 'EXPIRED':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-semibold gap-1">
            <AlertCircle className="h-3 w-3" /> Expirado
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-semibold gap-1">
            Estornado
          </Badge>
        );
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  const providerBadge = (prov: PaymentProvider) => {
    if (prov === 'MERCADO_PAGO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Zap className="h-3 w-3" /> Mercado Pago
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="h-3 w-3" /> AbacatePay
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicadores do Topo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label="Total Recebido Online"
          value={money(data?.totalApproved ?? 0)}
          hint="Valores compensados diretamente na sua conta"
        />
        <StatCard
          icon={CheckCircle2}
          label="Transações Aprovadas"
          value={String(data?.items?.filter((i) => i.status === 'APPROVED').length ?? 0)}
          hint="Recebimentos confirmados via Pix ou Cartão"
        />
        <StatCard
          icon={Clock}
          label="Total de Cobranças"
          value={String(data?.total ?? 0)}
          hint="Histórico total de cobranças geradas"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Gateway:</span>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#14141b] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
            >
              <option value="ALL">Todos os Provedores</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
              <option value="ABACATEPAY">AbacatePay</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#14141b] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
            >
              <option value="ALL">Todos os Status</option>
              <option value="APPROVED">Aprovados</option>
              <option value="PENDING">Aguardando Pagamento</option>
              <option value="EXPIRED">Expirados / Cancelados</option>
            </select>
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {/* Tabela de Transações */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : !data?.items?.length ? (
        <Card className="border-white/10 bg-black/30 p-12 text-center">
          <EmptyState
            icon={DollarSign}
            title="Nenhuma transação online encontrada"
            description="Quando os clientes pagarem agendamentos pelo site ou totem, as transações aparecerão aqui em tempo real."
          />
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3.5">Data / Hora</th>
                  <th className="px-4 py-3.5">Gateway</th>
                  <th className="px-4 py-3.5">Forma</th>
                  <th className="px-4 py-3.5">Destino / Cliente</th>
                  <th className="px-4 py-3.5 text-right">Valor</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {fmtDate(new Date(tx.createdAt), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {fmtTime(new Date(tx.createdAt))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {providerBadge(tx.provider)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-300">
                        {tx.paymentMethod === 'PIX' ? (
                          <>
                            <QrCode className="h-3.5 w-3.5 text-emerald-400" /> Pix
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3.5 w-3.5 text-sky-400" /> Cartão
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {tx.client?.name || 'Cliente Online'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {tx.appointment ? 'Agendamento Online' : tx.order ? `Comanda #${tx.order.number}` : 'Cobrança Avulsa'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-white whitespace-nowrap">
                      {money(tx.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {statusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-zinc-400">
              <div>
                Página {data.page} de {data.pages} ({data.total} registros)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
