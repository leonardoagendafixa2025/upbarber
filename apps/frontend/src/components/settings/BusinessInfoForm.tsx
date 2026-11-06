import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Phone, Save, Search } from 'lucide-react';
import { Button, Card, Field, ImageUpload, Input, Select, Textarea } from '@/components/ui';
import { useUpdateTenant, type Tenant } from '@/lib/api/tenant';
import { useAuthStore } from '@/store/auth.store';

const TIMEZONES = [
  ['America/Sao_Paulo', 'Brasília (GMT-3)'],
  ['America/Bahia', 'Bahia (GMT-3)'],
  ['America/Fortaleza', 'Fortaleza (GMT-3)'],
  ['America/Recife', 'Recife (GMT-3)'],
  ['America/Belem', 'Belém (GMT-3)'],
  ['America/Manaus', 'Manaus (GMT-4)'],
  ['America/Cuiaba', 'Cuiabá (GMT-4)'],
  ['America/Campo_Grande', 'Campo Grande (GMT-4)'],
  ['America/Porto_Velho', 'Porto Velho (GMT-4)'],
  ['America/Boa_Vista', 'Boa Vista (GMT-4)'],
  ['America/Rio_Branco', 'Rio Branco (GMT-5)'],
  ['America/Noronha', 'Fernando de Noronha (GMT-2)'],
];
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

const schema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(80),
  legalName: z.string(),
  document: z.string(),
  email: z.string().trim().email('E-mail inválido').or(z.literal('')),
  phone: z.string(),
  whatsapp: z.string(),
  description: z.string().max(2000),
  logoUrl: z.string().trim().url('URL inválida').or(z.literal('')),
  timezone: z.string(),
  addressZip: z.string(),
  addressStreet: z.string(),
  addressNumber: z.string(),
  addressComplement: z.string(),
  addressDistrict: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
});
type FormValues = z.infer<typeof schema>;

const toForm = (t: Tenant): FormValues => ({
  name: t.name ?? '',
  legalName: t.legalName ?? '',
  document: t.document ?? '',
  email: t.email ?? '',
  phone: t.phone ?? '',
  whatsapp: t.whatsapp ?? '',
  description: t.description ?? '',
  logoUrl: t.logoUrl ?? '',
  timezone: t.timezone ?? 'America/Sao_Paulo',
  addressZip: t.addressZip ?? '',
  addressStreet: t.addressStreet ?? '',
  addressNumber: t.addressNumber ?? '',
  addressComplement: t.addressComplement ?? '',
  addressDistrict: t.addressDistrict ?? '',
  addressCity: t.addressCity ?? '',
  addressState: t.addressState ?? '',
});

export function BusinessInfoForm({ tenant }: { tenant: Tenant }) {
  const update = useUpdateTenant('Dados da barbearia salvos');
  const [searchingCep, setSearchingCep] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, control, formState } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(tenant) });
  useEffect(() => reset(toForm(tenant)), [tenant, reset]);

  const lookupCep = async () => {
    const cep = watch('addressZip').replace(/\D/g, '');
    if (cep.length !== 8) return;
    setSearchingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setValue('addressStreet', d.logradouro || watch('addressStreet'), { shouldDirty: true });
        setValue('addressDistrict', d.bairro || watch('addressDistrict'), { shouldDirty: true });
        setValue('addressCity', d.localidade || watch('addressCity'), { shouldDirty: true });
        setValue('addressState', d.uf || watch('addressState'), { shouldDirty: true });
      }
    } catch {
      /* consulta de CEP opcional */
    } finally {
      setSearchingCep(false);
    }
  };

  const onSubmit = (v: FormValues) => {
    const nul = (s: string) => (s.trim() ? s.trim() : null);
    update.mutate(
      {
        name: v.name.trim(),
        legalName: nul(v.legalName),
        document: nul(v.document),
        email: nul(v.email),
        phone: nul(v.phone),
        whatsapp: nul(v.whatsapp),
        description: nul(v.description),
        logoUrl: nul(v.logoUrl),
        timezone: v.timezone,
        addressZip: nul(v.addressZip),
        addressStreet: nul(v.addressStreet),
        addressNumber: nul(v.addressNumber),
        addressComplement: nul(v.addressComplement),
        addressDistrict: nul(v.addressDistrict),
        addressCity: nul(v.addressCity),
        addressState: nul(v.addressState),
      },
      { onSuccess: (t) => useAuthStore.getState().updateCurrentTenant({ name: t.name, logoUrl: t.logoUrl }) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── CARD 1: Identidade Visual e Nome ── */}
      <Card className="p-6 border-white/10 bg-[#0d0d12]/90 backdrop-blur shadow-xl">
        <div className="mb-6 flex items-start gap-4 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Identidade & Marca
            </h2>
            <p className="text-xs text-zinc-400">
              Nome comercial, logotipo e descrição que seus clientes verão no agendamento e no site da barbearia.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Logotipo da Barbearia */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Logotipo da Barbearia
              </label>
              <span className="text-[11px] text-zinc-500">Mínimo 200×200px (JPG, PNG ou SVG)</span>
            </div>
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUpload
                  shape="square"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {formState.errors.logoUrl && (
              <p className="mt-1 text-xs text-red-500">{formState.errors.logoUrl.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da Barbearia *" required error={formState.errors.name?.message} hint="Nome principal exibido para clientes e relatórios">
              <Input
                {...register('name')}
                placeholder="Ex: Barbearia UP Vintage"
                className="font-medium"
              />
            </Field>

            <Field label="Razão Social" hint="Nome jurídico registrado">
              <Input
                {...register('legalName')}
                placeholder="Ex: UP Barber Serviços de Beleza LTDA"
              />
            </Field>

            <Field label="Descrição da Barbearia" className="sm:col-span-2" hint="Apresente sua barbearia, estilo de atendimento e diferenciais">
              <Textarea
                rows={3}
                {...register('description')}
                placeholder="Cortes clássicos, barba na toalha quente e cerveja gelada no coração da cidade..."
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* ── CARD 2: Comunicação & Identificação ── */}
      <Card className="p-6 border-white/10 bg-[#0d0d12]/90 backdrop-blur shadow-xl">
        <div className="mb-6 flex items-start gap-4 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Comunicação & Identificação
            </h2>
            <p className="text-xs text-zinc-400">
              Contatos oficiais da barbearia usados para confirmações, lembretes e notas fiscais.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="WhatsApp Principal" hint="Recebe notificações e alertas de agendamento">
            <Input
              inputMode="tel"
              {...register('whatsapp')}
              placeholder="(11) 99999-9999"
              className="border-amber-500/30 focus-visible:border-amber-500"
            />
          </Field>

          <Field label="Telefone Fixo / Recado">
            <Input
              inputMode="tel"
              {...register('phone')}
              placeholder="(11) 3333-4444"
            />
          </Field>

          <Field label="E-mail de Contato" error={formState.errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              placeholder="contato@barbearia.com.br"
            />
          </Field>

          <Field label="CPF ou CNPJ" hint="Documento fiscal da empresa">
            <Input
              {...register('document')}
              placeholder="00.000.000/0001-00"
            />
          </Field>

          <Field label="Fuso Horário" className="sm:col-span-2 lg:col-span-2" hint="Horário de referência da agenda e notificações">
            <Select {...register('timezone')}>
              {TIMEZONES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* ── CARD 3: Endereço & Localização ── */}
      <Card className="p-6 border-white/10 bg-[#0d0d12]/90 backdrop-blur shadow-xl">
        <div className="mb-6 flex items-start gap-4 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Endereço da Unidade
            </h2>
            <p className="text-xs text-zinc-400">
              Localização física onde os clientes comparecem para os atendimentos.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Field label="CEP" hint="Busca automática de endereço">
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  {...register('addressZip')}
                  onBlur={lookupCep}
                  placeholder="00000-000"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={searchingCep}
                  onClick={lookupCep}
                  className="shrink-0 border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                  title="Buscar endereço pelo CEP"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </Field>
          </div>

          <Field label="Logradouro (Rua / Av.)" className="sm:col-span-4">
            <Input {...register('addressStreet')} placeholder="Av. Paulista" />
          </Field>

          <Field label="Número" className="sm:col-span-2">
            <Input {...register('addressNumber')} placeholder="1000" />
          </Field>

          <Field label="Complemento" className="sm:col-span-4">
            <Input {...register('addressComplement')} placeholder="Sala 12, Bloco B" />
          </Field>

          <Field label="Bairro" className="sm:col-span-2">
            <Input {...register('addressDistrict')} placeholder="Bela Vista" />
          </Field>

          <Field label="Cidade" className="sm:col-span-3">
            <Input {...register('addressCity')} placeholder="São Paulo" />
          </Field>

          <Field label="UF" className="sm:col-span-1">
            <Select {...register('addressState')}>
              <option value="">-</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* ── BARRA INFERIOR DE AÇÕES ── */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d0d12]/95 p-4 backdrop-blur-md shadow-2xl">
        <div className="text-xs text-zinc-400">
          {formState.isDirty ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Você possui alterações não salvas
            </span>
          ) : (
            <span>Todas as alterações salvas</span>
          )}
        </div>
        <Button
          type="submit"
          loading={update.isPending}
          disabled={!formState.isDirty}
          className="border-[#c9a227] bg-gradient-to-r from-[#c9a227] to-[#f0cc66] font-bold text-black hover:brightness-110 shadow-lg shadow-amber-500/20 px-6"
        >
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </div>
    </form>
  );
}

export default BusinessInfoForm;
