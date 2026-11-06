import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Gift,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Percent,
  Scissors,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  X,
  Boxes,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MemberRole, useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { Avatar, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, TooltipProvider } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/utils/format';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: MemberRole[];
  end?: boolean;
}

const MANAGERS: MemberRole[] = ['OWNER', 'ADMIN'];
const STAFF: MemberRole[] = ['OWNER', 'ADMIN', 'RECEPTION'];

const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: '/app', label: 'Início', icon: LayoutDashboard, end: true },
      { to: '/app/agenda', label: 'Agenda', icon: Calendar },
      { to: '/app/comandas', label: 'Comandas', icon: ClipboardList },
      { to: '/app/caixa', label: 'Caixa', icon: Wallet, roles: STAFF },
      { to: '/app/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/app/profissionais', label: 'Profissionais', icon: Scissors },
      { to: '/app/servicos', label: 'Serviços', icon: ListChecks },
      { to: '/app/produtos', label: 'Produtos e estoque', icon: Boxes },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { to: '/app/financeiro', label: 'Financeiro', icon: CreditCard, roles: MANAGERS },
      { to: '/app/comissoes', label: 'Comissões', icon: Percent },
      { to: '/app/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { to: '/app/fidelidade', label: 'Fidelidade e pacotes', icon: Gift, roles: STAFF },
      { to: '/app/campanhas', label: 'Notícias e promoções', icon: Megaphone, roles: MANAGERS },
      { to: '/app/lista-espera', label: 'Lista de espera', icon: Clock },
      { to: '/app/pesquisas', label: 'Satisfação', icon: Star },
      { to: '/app/mensagens', label: 'Mensagens enviadas', icon: Bell, roles: STAFF },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { to: '/app/configuracoes', label: 'Barbearia e equipe', icon: Settings, roles: MANAGERS },
      { to: '/app/site', label: 'Site e agendamento online', icon: Globe, roles: MANAGERS },
      { to: '/app/plano', label: 'Plano e cobrança', icon: ShieldCheck, roles: MANAGERS },
    ],
  },
];

export default function AppShell() {
  const { user, current, memberships, clear } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const role = current?.role;

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    // Sincroniza memberships e barbearia ativa com a API para remover dados órfãos em caso de reset
    authApi
      .me()
      .then((data) => {
        if (data?.memberships) {
          useAuthStore.setState({ memberships: data.memberships });
        }
        if (data?.current && (!current || current.tenantId !== data.current.tenantId || current.tenant.slug === 'barbearia-demo')) {
          authApi.switchTenant(data.current.tenantId).then(() => {
            qc.invalidateQueries();
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const visible = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || (role && i.roles.includes(role)) || user?.isSuperAdmin) })).filter((g) => g.items.length);

  const logout = async () => {
    await authApi.logout();
    clear();
    navigate('/login');
  };

  const planBadge = current?.tenant.planStatus;
  const isWideView = location.pathname.startsWith('/app/agenda');

  const Sidebar = (
    <div className="flex h-full flex-col bg-[#0d0d12] border-r border-white/10 text-zinc-300">
      <div className="relative flex flex-col items-center justify-center border-b border-white/10 px-4 py-5">
        <Link to="/app" className="flex items-center justify-center">
          <img src="/logo.png?v=3" alt="UP BARBER" className="h-40 w-auto max-w-[200px] object-contain drop-shadow-[0_4px_20px_rgba(245,158,11,0.15)]" />
        </Link>
        <button className="absolute right-3 top-3 text-zinc-400 hover:text-white lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 scrollbar-thin">
        {visible.map((g, gi) => (
          <div key={gi} className="mb-4">
            {g.title && <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">{g.title}</div>}
            <div className="space-y-1">
              {g.items.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.end}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 font-semibold border-l-2 border-amber-400 shadow-sm shadow-amber-500/10'
                        : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white',
                    )
                  }
                >
                  <i.icon className="h-4.5 w-4.5 shrink-0 transition-colors group-hover:text-amber-400" />
                  <span>{i.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3.5 text-xs text-zinc-400">
        {planBadge === 'TRIAL' && (
          <Link to="/app/plano" className="mb-2.5 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-amber-300 transition-colors hover:bg-amber-500/20">
            <span className="font-semibold">Teste grátis ativo</span>
            <span className="text-[11px] underline opacity-90">Ver planos</span>
          </Link>
        )}
        <div className="flex items-center justify-between px-2 text-[11px] text-zinc-500">
          <span>UP BARBER v2.0</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-[#09090b] text-zinc-100">
        {/* sidebar desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="fixed h-screen w-64">{Sidebar}</div>
        </aside>
        {/* sidebar mobile */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72">{Sidebar}</div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {user?.isSuperAdmin && (
            <div className="flex items-center justify-between border-b border-[#c9a227]/30 bg-gray-950 px-4 py-2 text-xs text-white shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded border border-[#c9a227]/50 bg-[#c9a227]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f0cc66]">
                  MODO SUPERADMIN
                </span>
                <span className="hidden text-gray-300 sm:inline">
                  Gerenciando barbearia: <strong className="text-white">{current?.tenant.name ?? 'Nenhuma selecionada'}</strong>
                </span>
              </div>
              <Link
                to="/admin/barbearias"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#c9a227] px-2.5 py-1 text-xs font-semibold text-black transition-colors hover:bg-[#f0cc66]"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Voltar ao SuperAdmin
              </Link>
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#0d0d12]/90 px-4 backdrop-blur-md sm:px-6">
            <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {/* seletor de barbearia */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left transition-colors hover:bg-white/[0.08]">
                  <Avatar src={current?.tenant.logoUrl} name={current?.tenant.name} size="sm" color="#f59e0b" className="ring-1 ring-amber-500/40" />
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold leading-tight text-white">{current?.tenant.name}</div>
                    <div className="text-[11px] text-amber-400/90 font-medium">{role ? ROLE_LABEL[role] : ''}</div>
                  </div>
                  {memberships.length > 1 && <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>
              </DropdownMenuTrigger>
              {memberships.length > 1 && (
                <DropdownMenuContent align="start" className="w-64 border border-white/10 bg-[#141419] text-white">
                  <DropdownMenuLabel className="text-zinc-400">Minhas barbearias</DropdownMenuLabel>
                  {memberships.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => authApi.switchTenant(m.tenantId).then(() => navigate('/app'))} className="hover:bg-white/10 focus:bg-white/10">
                      <Avatar src={m.tenant.logoUrl} name={m.tenant.name} size="sm" color="#f59e0b" />
                      <span className="truncate">{m.tenant.name}</span>
                      {m.tenantId === current?.tenantId && <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-300 border-amber-500/30">atual</Badge>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
            <div className="ml-auto flex items-center gap-2">
              {current && (
                <Button variant="outline" size="sm" asChild className="hidden border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 md:inline-flex">
                  <a href={`/b/${current.tenant.slug}`} target="_blank" rel="noreferrer">
                    <Globe className="h-4 w-4" /> Ver site
                  </a>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-amber-500/30 hover:ring-amber-500/60 transition-all">
                    <Avatar src={user?.avatarUrl} name={user?.name} size="md" color="#f59e0b" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border border-white/10 bg-[#141419] text-white">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-semibold text-white">{user?.name}</div>
                    <div className="truncate text-xs text-zinc-400">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => navigate('/app/perfil')} className="hover:bg-white/10 focus:bg-white/10">
                    <User className="mr-2 h-4 w-4 text-amber-400" /> Meu perfil
                  </DropdownMenuItem>
                  {user?.isSuperAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="hover:bg-white/10 focus:bg-white/10">
                      <ShieldCheck className="mr-2 h-4 w-4 text-amber-400" /> Administração
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/cliente')} className="hover:bg-white/10 focus:bg-white/10">
                    <Calendar className="mr-2 h-4 w-4 text-amber-400" /> Meus agendamentos (cliente)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} destructive className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className={cn('flex-1 bg-[#09090b]', isWideView ? 'p-3 sm:p-4 lg:p-6' : 'p-4 sm:p-6 lg:p-8')}>
            <div className={cn('mx-auto', isWideView ? 'w-full max-w-[1920px]' : 'max-w-7xl')}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { Package };
