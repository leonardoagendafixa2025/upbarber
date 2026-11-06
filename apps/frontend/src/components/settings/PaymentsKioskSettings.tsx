import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '@/lib/api/client';
import { paymentsApi, PaymentProvider } from '@/lib/api/payments';
import { Badge, Button, Card, Field, Input, Section, Switch } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';

interface TenantLike {
  id: string;
  slug: string;
  onlinePaymentEnabled: boolean;
  defaultOnlineProvider?: string | null;
  requirePrepayment: boolean;
  allowCounterPayment?: boolean;
  kioskEnabled: boolean;
  posEnabled: boolean;
  posProvider: string | null;
  integrations?: {
    mercadoPago?: boolean;
    mercadoPagoAccount?: string | null;
    abacatePay?: boolean;
    abacatePayAccount?: string | null;
    pos: boolean;
    posDeviceId: string | null;
    kioskToken: string | null;
  };
}

export default function PaymentsKioskSettings({ tenant }: { tenant: TenantLike }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const updateStore = useAuthStore((s) => s.updateCurrentTenant);

  // Consulta de conexões ativas
  const { data: connections } = useQuery({
    queryKey: ['payment-connections', tenant.id],
    queryFn: () => paymentsApi.getConnections(),
  });

  const mpConn = connections?.find((c) => c.provider === 'MERCADO_PAGO' && c.status === 'CONNECTED');
  const abacateConn = connections?.find((c) => c.provider === 'ABACATEPAY' && c.status === 'CONNECTED');

  // Estados locais
  const [defaultProvider, setDefaultProvider] = useState<string>(
    tenant.defaultOnlineProvider || 'MERCADO_PAGO',
  );
  const [requirePrepayment, setRequirePrepayment] = useState(tenant.requirePrepayment);
  const [allowCounterPayment, setAllowCounterPayment] = useState(
    tenant.allowCounterPayment !== false,
  );
  const [abacateKey, setAbacateKey] = useState('');
  const [pos, setPos] = useState({
    posEnabled: tenant.posEnabled,
    posAccessToken: '',
    posDeviceId: tenant.integrations?.posDeviceId ?? '',
  });
  const [kiosk, setKiosk] = useState({ kioskEnabled: tenant.kioskEnabled });
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  // ------------------------------------------------------------------
  // TRATAMENTO DO RETORNO OAUTH DO MERCADO PAGO
  // ------------------------------------------------------------------
  useEffect(() => {
    const code = params.get('code');
    const state = params.get('state');

    if (code && state && !isProcessingOAuth) {
      setIsProcessingOAuth(true);
      const redirectUri = `${window.location.origin}/app/configuracoes?tab=online`;

      toast.loading('Finalizando conexão com o Mercado Pago...', { id: 'mp-oauth' });
      paymentsApi
        .handleMercadoPagoCallback(code, state, redirectUri)
        .then((res) => {
          toast.success(`Mercado Pago conectado com sucesso! (${res.accountName})`, { id: 'mp-oauth' });
          qc.invalidateQueries({ queryKey: ['payment-connections', tenant.id] });
          qc.invalidateQueries({ queryKey: ['tenant'] });
          // Limpa os parâmetros da URL
          params.delete('code');
          params.delete('state');
          params.delete('platform_id');
          setParams(params, { replace: true });
        })
        .catch((err) => {
          toast.error(errorMessage(err, 'Falha ao conectar com o Mercado Pago'), { id: 'mp-oauth' });
          params.delete('code');
          params.delete('state');
          setParams(params, { replace: true });
        })
        .finally(() => setIsProcessingOAuth(false));
    }
  }, [params]);

  // Iniciar fluxo OAuth
  const startMercadoPagoOAuth = async () => {
    try {
      const redirectUri = `${window.location.origin}/app/configuracoes?tab=online`;
      const { url } = await paymentsApi.getMercadoPagoAuthUrl(redirectUri);
      window.location.href = url;
    } catch (err: any) {
      toast.error(errorMessage(err, 'Não foi possível iniciar conexão OAuth'));
    }
  };

  // Conectar AbacatePay
  const connectAbacateMutation = useMutation({
    mutationFn: () => paymentsApi.connectAbacatePay(abacateKey),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['payment-connections', tenant.id] });
      qc.invalidateQueries({ queryKey: ['tenant'] });
      setAbacateKey('');
      toast.success(`AbacatePay conectada com sucesso! (${res.storeName || 'Loja'})`);
    },
    onError: (e) => toast.error(errorMessage(e, 'Erro ao conectar AbacatePay')),
  });

  // Desconectar Provedor
  const disconnectMutation = useMutation({
    mutationFn: (provider: PaymentProvider) => paymentsApi.disconnect(provider),
    onSuccess: (_, prov) => {
      qc.invalidateQueries({ queryKey: ['payment-connections', tenant.id] });
      qc.invalidateQueries({ queryKey: ['tenant'] });
      toast.success(`Integração ${prov === 'MERCADO_PAGO' ? 'Mercado Pago' : 'AbacatePay'} desconectada`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // Salvar Preferências
  const savePreferences = useMutation({
    mutationFn: () =>
      paymentsApi.updateSettings({
        defaultOnlineProvider: defaultProvider,
        requirePrepayment,
        allowCounterPayment,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Preferências de pagamento salvas');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // Salvar Maquininha POS
  const savePos = useMutation({
    mutationFn: () =>
      api.patch('/tenant', {
        posEnabled: pos.posEnabled,
        posProvider: 'MERCADOPAGO_POINT',
        posDeviceId: pos.posDeviceId.trim() || null,
        ...(pos.posAccessToken.trim() ? { posAccessToken: pos.posAccessToken.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Configurações da maquininha salvas');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // Gerar link Totem
  const regenKiosk = useMutation({
    mutationFn: () => api.post<{ kioskToken: string }>('/tenant/kiosk-token').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      setKiosk({ kioskEnabled: true });
      toast.success('Token do totem gerado com sucesso');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const kioskUrl = tenant.integrations?.kioskToken
    ? `${window.location.origin}/totem/${tenant.slug}?k=${tenant.integrations.kioskToken}`
    : null;

  const copy = (v: string, msg = 'Copiado') => {
    navigator.clipboard?.writeText(v);
    toast.success(msg);
  };

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* 1. PAGAMENTO ONLINE MULTI-TENANT */}
      {/* ================================================================= */}
      <Section
        title={
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-400" /> Pagamento Online Oficial (Multi-Tenant)
          </span>
        }
        description="Cada barbearia recebe 100% diretamente em sua própria conta independente. Sem intermediários, sem split e sem saldo retido na plataforma."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* CARD A: MERCADO PAGO ONLINE (OAUTH) */}
          <Card className="flex flex-col justify-between border-white/10 bg-black/40 p-5 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Mercado Pago Online</h3>
                    <p className="text-xs text-zinc-400">OAuth Oficial · Pix e Cartão de Crédito</p>
                  </div>
                </div>
                {mpConn ? (
                  <Badge variant="default" className="bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-semibold gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    Desconectado
                  </Badge>
                )}
              </div>

              {mpConn ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Titular da Conta:</span>
                    <span className="font-medium text-white">{mpConn.accountName || 'Identificada'}</span>
                  </div>
                  {mpConn.accountEmail && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">E-mail:</span>
                      <span className="font-mono text-zinc-300">{mpConn.accountEmail}</span>
                    </div>
                  )}
                  {mpConn.providerAccountId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ID da Conta (Vendedor):</span>
                      <span className="font-mono text-zinc-400">#{mpConn.providerAccountId}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-zinc-500">Conectado em:</span>
                    <span>{new Date(mpConn.connectedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Conecte sua conta do Mercado Pago em 1 clique. O cliente agenda online ou pelo totem e o dinheiro entra direto no seu saldo do Mercado Pago.
                </p>
              )}
            </div>

            <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
              {mpConn ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    loading={disconnectMutation.isPending}
                    onClick={() => disconnectMutation.mutate('MERCADO_PAGO')}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Desconectar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                    onClick={startMercadoPagoOAuth}
                  >
                    Reconectar
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-[#009ee3] hover:bg-[#0082ba] text-white font-bold shadow-lg shadow-[#009ee3]/20"
                  onClick={startMercadoPagoOAuth}
                  disabled={isProcessingOAuth}
                >
                  <Zap className="h-4 w-4 mr-2" /> Conectar Mercado Pago
                </Button>
              )}
            </div>
          </Card>

          {/* CARD B: ABACATEPAY ONLINE (API KEY INDIVIDUAL) */}
          <Card className="flex flex-col justify-between border-white/10 bg-black/40 p-5 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">AbacatePay Online</h3>
                    <p className="text-xs text-zinc-400">Chave Individual · Pix Instantâneo</p>
                  </div>
                </div>
                {abacateConn ? (
                  <Badge variant="default" className="bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-semibold gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    Desconectado
                  </Badge>
                )}
              </div>

              {abacateConn ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Loja Identificada:</span>
                    <span className="font-medium text-white">{abacateConn.accountName || 'Loja Ativa'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chave de API:</span>
                    <span className="font-mono text-zinc-400">{abacateConn.maskedKey || '••••••••'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-zinc-500">Conectado em:</span>
                    <span>{new Date(abacateConn.connectedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Insira a Chave de API da sua conta individual na AbacatePay gerada no menu <strong className="text-zinc-200">Integrações › API Keys</strong>.
                  </p>
                  <Field label="Chave de API (AbacatePay)">
                    <Input
                      type="password"
                      placeholder="aba_prod_..."
                      value={abacateKey}
                      onChange={(e) => setAbacateKey(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
              {abacateConn ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  loading={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate('ABACATEPAY')}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Desconectar
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  loading={connectAbacateMutation.isPending}
                  disabled={!abacateKey.trim()}
                  onClick={() => connectAbacateMutation.mutate()}
                >
                  Salvar e Conectar AbacatePay
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* REGRAS E PREFERÊNCIAS DE RECEBIMENTO */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
          <h4 className="font-bold text-sm text-white">Preferências de Agendamento e Pagamento</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Provedor de Pagamento Padrão
              </label>
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#14141b] px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="MERCADO_PAGO">Mercado Pago (Recomendado)</option>
                <option value="ABACATEPAY">AbacatePay</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">Usado automaticamente na geração de cobranças e Pix.</p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Exigir pagamento antecipado</div>
                  <div className="text-[11px] text-zinc-400">O horário só fica garantido após a aprovação online.</div>
                </div>
                <Switch checked={requirePrepayment} onCheckedChange={setRequirePrepayment} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Permitir pagamento presencial</div>
                  <div className="text-[11px] text-zinc-400">Clientes podem optar por pagar na barbearia no balcão.</div>
                </div>
                <Switch checked={allowCounterPayment} onCheckedChange={setAllowCounterPayment} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/5">
            <Button
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
              loading={savePreferences.isPending}
              onClick={() => savePreferences.mutate()}
            >
              Salvar Preferências
            </Button>
          </div>
        </div>
      </Section>

      {/* ================================================================= */}
      {/* 2. MAQUININHA MERCADO PAGO POINT (100% PRESERVADA) */}
      {/* ================================================================= */}
      <Section
        title={
          <span className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-sky-400" /> Maquininha Física (Mercado Pago Point)
          </span>
        }
        description="Envie a cobrança da comanda direto para a maquininha física, pelo painel ou pelo totem. Suporta Point Smart e Point Pro 2 em modo PDV."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300 space-y-1">
            <p className="font-semibold text-white">Instruções para Point Smart / Pro 2:</p>
            <p className="text-zinc-400">
              No painel do Mercado Pago Developers, crie uma aplicação para a maquininha física, gere o <strong className="text-zinc-200">Access Token de Produção</strong> e ative o modo PDV. O ID do aparelho aparece em Integrações › Point.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4">
            <div>
              <div className="text-sm font-medium text-white">Status da Maquininha</div>
              <div className="text-xs text-zinc-400">
                {tenant.integrations?.pos ? `Aparelho ativo: ${tenant.integrations.posDeviceId}` : 'Nenhum aparelho configurado'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              Ativa <Switch checked={pos.posEnabled} onCheckedChange={(v) => setPos((s) => ({ ...s, posEnabled: v }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Access Token da Maquininha" hint={tenant.integrations?.pos ? 'Deixe em branco para manter o atual' : undefined}>
              <Input
                type="password"
                placeholder="APP_USR-…"
                value={pos.posAccessToken}
                onChange={(e) => setPos((s) => ({ ...s, posAccessToken: e.target.value }))}
              />
            </Field>
            <Field label="ID do Aparelho (device_id)">
              <Input
                placeholder="PAX_A910__SMARTPOS…"
                value={pos.posDeviceId}
                onChange={(e) => setPos((s) => ({ ...s, posDeviceId: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold"
              loading={savePos.isPending}
              onClick={() => savePos.mutate()}
            >
              Salvar Maquininha Point
            </Button>
          </div>
        </div>
      </Section>

      {/* ================================================================= */}
      {/* 3. TOTEM DE AUTOATENDIMENTO (PRESERVADO) */}
      {/* ================================================================= */}
      <Section
        title={
          <span className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-400" /> Totem de Autoatendimento
          </span>
        }
        description="Tablet na recepção para autoatendimento: check-in do cliente, pagamento e agendamento da próxima visita."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4">
            <div>
              <div className="text-sm font-medium text-white">Totem Ativo</div>
              <div className="text-xs text-zinc-400">
                Abra o link em modo tela cheia no tablet da barbearia.
              </div>
            </div>
            <Switch
              checked={kiosk.kioskEnabled}
              onCheckedChange={(v) => {
                setKiosk({ kioskEnabled: v });
                api.patch('/tenant', { kioskEnabled: v }).then(() => {
                  qc.invalidateQueries({ queryKey: ['tenant'] });
                  updateStore({});
                });
              }}
            />
          </div>

          {kioskUrl ? (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate text-xs font-mono text-amber-400">{kioskUrl}</code>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(kioskUrl, 'Link do totem copiado')}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={kioskUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Gere o token para obter o link seguro do totem.</p>
          )}

          <div className="flex justify-end">
            <Button variant="outline" loading={regenKiosk.isPending} onClick={() => regenKiosk.mutate()}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> {kioskUrl ? 'Gerar novo link' : 'Gerar link do totem'}
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
