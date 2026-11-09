import { AuthenticationCreds, AuthenticationState, BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';

/**
 * Adaptador de persistência da sessão Baileys usando o PostgreSQL (Supabase) via Prisma.
 * Garante que a conexão do WhatsApp não se perca após deploys ou reinícios no Render.
 */
export async function usePrismaAuthState(
  prisma: PrismaService,
  sessionKey = 'global',
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearSession: () => Promise<void>;
}> {
  const prefix = `baileys:${sessionKey}:`;
  const memoryCache = new Map<string, any>();

  // Pré-carrega todas as chaves existentes desta sessão para a memória
  try {
    const rows = await prisma.platformSetting.findMany({
      where: { id: { startsWith: prefix } },
    });
    for (const row of rows) {
      const fileKey = row.id.slice(prefix.length);
      try {
        const val = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
        memoryCache.set(fileKey, val);
      } catch (_) {
        // ignora erro de parse individual
      }
    }
  } catch (_) {
    // ignora falha inicial
  }

  const writeData = async (data: any, file: string) => {
    memoryCache.set(file, data);
    try {
      const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
      await prisma.platformSetting.upsert({
        where: { id: `${prefix}${file}` },
        create: { id: `${prefix}${file}`, data: serialized },
        update: { data: serialized },
      });
    } catch (_) {}
  };

  const readData = async (file: string) => {
    if (memoryCache.has(file)) {
      return memoryCache.get(file);
    }
    try {
      const row = await prisma.platformSetting.findUnique({
        where: { id: `${prefix}${file}` },
      });
      if (row?.data) {
        const val = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
        memoryCache.set(file, val);
        return val;
      }
    } catch (_) {}
    return null;
  };

  const removeData = async (file: string) => {
    memoryCache.delete(file);
    try {
      await prisma.platformSetting.deleteMany({
        where: { id: `${prefix}${file}` },
      });
    } catch (_) {}
  };

  const clearSession = async () => {
    memoryCache.clear();
    try {
      await prisma.platformSetting.deleteMany({
        where: { id: { startsWith: prefix } },
      });
    } catch (_) {}
  };

  const creds: AuthenticationCreds = (await readData('creds.json')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, 'creds.json'),
    clearSession,
  };
}
