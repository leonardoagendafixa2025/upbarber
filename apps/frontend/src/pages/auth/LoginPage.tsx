import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, Mail, Sparkles, UserRound } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { AuthLayout, PasswordInput } from '@/components/auth/AuthLayout';
import { authApi } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';

const schema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormData) => {
    try {
      const data = await authApi.login(v.email.trim().toLowerCase(), v.password);
      toast.success(`Bem-vindo de volta, ${data.user.name.split(' ')[0]}!`);
      if (data.current) navigate(location.state?.from?.pathname ?? '/app', { replace: true });
      else if (data.user.isSuperAdmin) navigate('/admin', { replace: true });
      else navigate('/cliente', { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, 'Não foi possível entrar'));
    }
  };

  return (
    <AuthLayout
      title="Acessar o painel"
      subtitle="Entre com seu e-mail e senha para gerenciar sua barbearia."
      footer={
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xs text-gray-400">Ainda não tem conta no UP BARBER?</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5 w-full border-[#d4a93c]/40 bg-[#d4a93c]/10 text-[#f0cc66] hover:bg-[#d4a93c]/20 hover:text-white font-bold"
              asChild
            >
              <Link to="/cadastro" className="flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a93c]" />
                Testar Grátis por 30 Dias
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/cliente/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <UserRound className="h-3.5 w-3.5 text-[#d4a93c]" />
              É cliente e quer agendar um horário? <span className="text-[#f0cc66] font-semibold underline underline-offset-2">Clique aqui</span>
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="E-mail profissional" error={formState.errors.email?.message}>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              type="email"
              autoComplete="email"
              placeholder="voce@barbearia.com"
              autoFocus
              className="h-11 rounded-xl bg-[#090a0f] border-white/10 pl-10 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#d4a93c] focus-visible:ring-2 focus-visible:ring-[#d4a93c]/20 transition-all"
              {...register('email')}
            />
          </div>
        </Field>

        <Field label="Senha" error={formState.errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Digite sua senha"
            {...register('password')}
          />
        </Field>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300">
            <input type="checkbox" className="rounded border-white/20 bg-black/40 text-[#d4a93c] focus:ring-0" />
            <span>Lembrar de mim</span>
          </label>
          <Link
            to="/esqueci-senha"
            className="font-semibold text-gray-400 hover:text-[#f0cc66] transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 rounded-xl border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] text-base font-black text-black shadow-lg shadow-[#d4a93c]/25 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.01]"
          loading={formState.isSubmitting}
        >
          Entrar no Painel
        </Button>
      </form>
    </AuthLayout>
  );
}
