import PaymentsKioskSettings from '@/components/settings/PaymentsKioskSettings';
import { useSearchParams } from 'react-router-dom';
import { Building2, CalendarClock, Clock, CreditCard, MessageSquareText, Settings, Sliders, Smartphone, Users } from 'lucide-react';
import { Button, EmptyState, PageLoader } from '@/components/ui';
import { BusinessInfoForm } from '@/components/settings/BusinessInfoForm';
import { OpeningHoursForm } from '@/components/settings/OpeningHoursForm';
import { BookingSettingsForm } from '@/components/settings/BookingSettingsForm';
import { MessagesSettingsForm } from '@/components/settings/MessagesSettingsForm';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { PaymentMethodsSettings } from '@/components/settings/PaymentMethodsSettings';
import { errorMessage } from '@/lib/api/client';
import { useTenant } from '@/lib/api/tenant';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { value: 'dados', label: 'Dados da barbearia', icon: Building2, desc: 'Identificação e endereço' },
  { value: 'horario', label: 'Horário de funcionamento', icon: Clock, desc: 'Abertura e fechamento' },
  { value: 'agendamento', label: 'Agendamento online', icon: CalendarClock, desc: 'Regras para clientes' },
  { value: 'mensagens', label: 'Mensagens automáticas', icon: MessageSquareText, desc: 'WhatsApp e e-mail' },
  { value: 'equipe', label: 'Equipe e acessos', icon: Users, desc: 'Permissões e usuários' },
  { value: 'pagamentos', label: 'Formas de pagamento', icon: CreditCard, desc: 'Bandeiras e taxas' },
  { value: 'online', label: 'Pagamento online e totem', icon: Smartphone, desc: 'Pix, cartão e autoatendimento' },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const isOAuthCallback = params.has('code') || params.has('state');
  const activeTabParam = params.get('tab');
  const tab = isOAuthCallback
    ? 'online'
    : TABS.some((t) => t.value === activeTabParam)
    ? activeTabParam!
    : 'dados';
  const { data: tenant, isLoading, error, refetch } = useTenant();

  const handleSelectTab = (val: string) => {
    setParams({ tab: val }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho refinado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Configurações
              {tenant?.name && (
                <span className="hidden sm:inline-block rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {tenant.name}
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-400">
              Gerencie dados cadastrais, horários, agendamento, equipe e regras financeiras da sua barbearia.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error || !tenant ? (
        <EmptyState
          icon={Settings}
          title="Não foi possível carregar as configurações"
          description={errorMessage(error)}
          action={<Button onClick={() => refetch()} className="border-[#c9a227] bg-[#c9a227] text-black hover:bg-[#f0cc66]">Tentar novamente</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Navegação de Abas Premium */}
          <div className="border-b border-white/10 pb-4">
            <nav className="flex flex-wrap gap-2 sm:gap-2.5" aria-label="Abas de configurações">
              {TABS.map((t) => {
                const isActive = tab === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleSelectTab(t.value)}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                      isActive
                        ? 'border border-amber-500/60 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30 font-semibold'
                        : 'border border-white/10 bg-[#101015] text-zinc-400 hover:border-amber-500/30 hover:bg-[#16161e] hover:text-zinc-200',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400/80',
                      )}
                    />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="w-full">
            {tab === 'dados' && <BusinessInfoForm tenant={tenant} />}
            {tab === 'horario' && <OpeningHoursForm tenant={tenant} />}
            {tab === 'agendamento' && <BookingSettingsForm tenant={tenant} />}
            {tab === 'mensagens' && <MessagesSettingsForm tenant={tenant} />}
            {tab === 'equipe' && <TeamSettings />}
            {tab === 'pagamentos' && <PaymentMethodsSettings />}
            {tab === 'online' && <PaymentsKioskSettings tenant={tenant} />}
          </div>
        </div>
      )}
    </div>
  );
}
