import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, Briefcase, Mail, Scissors } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { AuthLayout, CLIENT_BENEFITS, PasswordInput } from '@/components/auth/AuthLayout';
import { authApi } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';

const schema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});
type FormData = z.infer<typeof schema>;

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormData) => {
    try {
      const data = await authApi.login(v.email.trim().toLowerCase(), v.password);
      toast.success(`Olá, ${data.user.name.split(' ')[0]}!`);
      navigate(redirect ?? '/cliente', { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, 'Não foi possível entrar'));
    }
  };

  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return (
    <AuthLayout
      title="Área do Cliente"
      subtitle="Entre com seu e-mail para agendar e acompanhar seus horários."
      sideTitle="Seu horário na barbearia, na palma da sua mão"
      sideText="Agende, remarque e acompanhe seus atendimentos e pontos de fidelidade nas barbearias que utilizam o UP BARBER."
      benefits={CLIENT_BENEFITS}
      footer={
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xs text-gray-400">Primeira vez por aqui?</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5 w-full border-[#d4a93c]/40 bg-[#d4a93c]/10 text-[#f0cc66] hover:bg-[#d4a93c]/20 hover:text-white font-bold"
              asChild
            >
              <Link to={`/cliente/cadastro${qs}`} className="flex items-center justify-center gap-2">
                <Scissors className="h-3.5 w-3.5 text-[#d4a93c]" />
                Criar Cadastro de Cliente
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-[#d4a93c]" />
              Trabalha ou é dono de barbearia? <span className="text-[#f0cc66] font-semibold underline underline-offset-2">Acessar painel do profissional</span>
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Seu e-mail" error={formState.errors.email?.message}>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="seuemail@exemplo.com"
              className="h-11 rounded-xl bg-[#090a0f] border-white/10 pl-10 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#d4a93c] focus-visible:ring-2 focus-visible:ring-[#d4a93c]/20 transition-all"
              {...register('email')}
            />
          </div>
        </Field>

        <Field label="Sua senha" error={formState.errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Digite sua senha"
            {...register('password')}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            to="/esqueci-senha"
            className="text-xs font-semibold text-gray-400 hover:text-[#f0cc66] transition-colors"
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
          Entrar na Área do Cliente
        </Button>
      </form>
    </AuthLayout>
  );
}
