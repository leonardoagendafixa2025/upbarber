import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { FloatingWhatsAppButton } from '@/components/site/FloatingWhatsAppButton';

const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/funcionalidades', label: 'Funcionalidades' },
  { to: '/precos', label: 'Preços' },
];

/** Layout do site institucional (landing) */
export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  const token = useAuthStore((s) => s.accessToken);
  const current = useAuthStore((s) => s.current);
  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden w-full max-w-full">
      <header className="sticky top-0 z-40 border-b border-[#d4a93c]/20 bg-[#08090d]/85 backdrop-blur-xl shadow-xl shadow-black/60">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center gap-4 sm:gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center transition-transform hover:scale-105">
            <img src="/logo.png?v=3" alt="UP BARBER" className="h-12 sm:h-16 w-auto object-contain drop-shadow" />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3.5 py-2 text-sm font-semibold tracking-wide transition-all',
                    isActive
                      ? 'bg-[#d4a93c]/15 text-[#f0cc66] shadow-sm'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            {token ? (
              <Button asChild className="border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] to-[#c9a227] font-bold text-black shadow-md shadow-[#d4a93c]/20 hover:from-[#f0cc66] hover:to-[#d4a93c]">
                <Link to={current ? '/app' : '/cliente'}>Acessar painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-gray-300 hover:bg-white/10 hover:text-white text-xs font-semibold">
                  <Link to="/cliente/login">Sou cliente</Link>
                </Button>
                <Button variant="outline" asChild className="border-white/20 bg-white/5 text-gray-200 hover:border-[#d4a93c]/50 hover:bg-[#d4a93c]/10 hover:text-[#f0cc66] text-xs font-semibold">
                  <Link to="/login">Acessar</Link>
                </Button>
                <Button asChild className="border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] font-extrabold text-black shadow-lg shadow-[#d4a93c]/20 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.02]">
                  <Link to="/cadastro">Teste grátis 30 dias</Link>
                </Button>
              </>
            )}
          </div>
          <button className="ml-auto text-[#d4a93c] hover:text-[#f0cc66] md:hidden p-2 rounded-lg bg-white/5" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-[#d4a93c]/20 bg-[#0d0e14] px-4 py-4 md:hidden space-y-3">
            <div className="space-y-1">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-[#f0cc66]">
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Button variant="ghost" asChild className="text-gray-300 hover:bg-white/10 justify-start">
                <Link to="/cliente/login" onClick={() => setOpen(false)}>Sou cliente</Link>
              </Button>
              <Button variant="outline" asChild className="border-white/20 text-gray-200 justify-start">
                <Link to="/login" onClick={() => setOpen(false)}>Acessar</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-[#d4a93c] to-[#c9a227] text-black font-bold">
                <Link to="/cadastro" onClick={() => setOpen(false)}>Teste grátis 30 dias</Link>
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-gray-950 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center">
              <img src="/logo.png?v=3" alt="UP BARBER" className="h-28 w-auto object-contain drop-shadow" />
            </div>
            <p className="mt-3 max-w-md text-sm text-gray-400">Sistema de gestão on-line para barbearias: agenda, comandas, caixa, estoque, comissões, fidelidade e site com agendamento. Uma nova experiência para uma antiga tradição.</p>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-white">Produto</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/funcionalidades" className="hover:text-white">Funcionalidades</Link></li>
              <li><Link to="/precos" className="hover:text-white">Preços</Link></li>
              <li><Link to="/cadastro" className="hover:text-white">Criar conta</Link></li>
              <li><Link to="/cliente/login" className="hover:text-white">Área do cliente</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-white">Legal & Contato</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade (LGPD)</Link></li>
              <li className="pt-2 text-xs text-gray-400">Suporte direto via WhatsApp</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>© {new Date().getFullYear()} UP BARBER. Todos os direitos reservados.</span>
            <span>•</span>
            <Link to="/termos" className="hover:underline">Termos</Link>
            <span>•</span>
            <Link to="/privacidade" className="hover:underline">Privacidade</Link>
          </div>
        </div>
      </footer>
      <FloatingWhatsAppButton />
    </div>
  );
}
