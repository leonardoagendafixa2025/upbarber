import { useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { errorMessage } from '@/lib/api/client';
import { mediaApi } from '@/lib/api/media';
import { Button } from './button';
import { Input } from './input';

/** Botão que abre o seletor de arquivos, envia as imagens e devolve as URLs públicas. */
export function UploadButton({
  onUploaded,
  multiple = false,
  maxDim = 1600,
  disabled,
  children,
  variant = 'outline',
  size,
  className,
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  maxDim?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, multiple ? 20 : 1);
    setBusy(true);
    const urls: string[] = [];
    let failed = 0;
    for (const f of list) {
      try {
        const m = await mediaApi.upload(f, maxDim);
        urls.push(m.url);
      } catch (e) {
        failed++;
        toast.error(`${f.name}: ${errorMessage(e, 'não foi possível enviar')}`);
      }
    }
    setBusy(false);
    if (ref.current) ref.current.value = '';
    if (urls.length) {
      onUploaded(urls);
      if (list.length > 1) toast.success(`${urls.length} foto(s) enviada(s)${failed ? `, ${failed} com erro` : ''}`);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      <Button type="button" variant={variant} size={size} loading={busy} disabled={disabled} className={className} onClick={() => ref.current?.click()}>
        {children ?? (
          <>
            <Upload /> {multiple ? 'Enviar fotos' : 'Enviar imagem'}
          </>
        )}
      </Button>
    </>
  );
}

/**
 * Campo de imagem única: pré-visualização + enviar do aparelho + opção de colar um link.
 * `value` é a URL atual ('' quando vazio).
 */
export function ImageUpload({
  value,
  onChange,
  shape = 'square',
  maxDim,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  shape?: 'square' | 'circle' | 'wide';
  maxDim?: number;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const [linkMode, setLinkMode] = useState(false);
  const [link, setLink] = useState('');
  const dim = maxDim ?? (shape === 'wide' ? 1600 : 800);

  const box = {
    square: 'h-24 w-24 rounded-2xl',
    circle: 'h-24 w-24 rounded-full',
    wide: 'h-24 w-44 rounded-2xl',
  }[shape];

  const applyLink = () => {
    const v = link.trim();
    if (!/^https?:\/\/.+/i.test(v)) return toast.error('Informe um link válido (https://...)');
    onChange(v);
    setLink('');
    setLinkMode(false);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-4">
        <div className={cn('flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[#0d0d12] shadow-inner ring-1 ring-white/5 transition-all', box, value ? 'ring-amber-500/30' : '')}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : placeholder ?? <ImagePlus className="h-8 w-8 text-amber-400/60" />}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <UploadButton
            size="sm"
            maxDim={dim}
            disabled={disabled}
            className="border-amber-500/30 bg-amber-500/10 font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60"
            onUploaded={(urls) => onChange(urls[0])}
          >
            <Upload className="h-4 w-4" /> {value ? 'Trocar imagem' : 'Enviar imagem'}
          </UploadButton>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => setLinkMode((v) => !v)}
            aria-label="Usar link"
          >
            <Link2 className="h-3.5 w-3.5" /> Colar link
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => onChange('')}
              aria-label="Remover imagem"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
          )}
        </div>
      </div>
      {linkMode && (
        <div className="flex max-w-md gap-2">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66]"
            onClick={applyLink}
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
