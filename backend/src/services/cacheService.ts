import NodeCache from 'node-cache';

/**
 * Serviço de cache em memória usando node-cache
 * 
 * TTLs configurados:
 * - Licenses: 5 minutos (validações frequentes, mas dados podem mudar)
 * - Slots disponíveis: 1 minuto (dados mudam frequentemente com bookings)
 * - Dados de usuário: 15 minutos (dados relativamente estáticos)
 */

// Cache de validação de licenses (TTL: 5 minutos)
export const licenseCache = new NodeCache({
  stdTTL: 5 * 60, // 5 minutos
  checkperiod: 60, // Verificar expiração a cada 1 minuto
  useClones: false, // Performance: não clonar objetos
});

// Cache de slots disponíveis por publicLink (TTL: 1 minuto)
export const slotsCache = new NodeCache({
  stdTTL: 60, // 1 minuto
  checkperiod: 30, // Verificar expiração a cada 30 segundos
  useClones: false,
});

// Cache de dados de usuário (TTL: 15 minutos)
export const userCache = new NodeCache({
  stdTTL: 15 * 60, // 15 minutos
  checkperiod: 60, // Verificar expiração a cada 1 minuto
  useClones: false,
});

/**
 * Função auxiliar para gerar chave de cache
 */
export const getCacheKey = {
  license: (code: string) => `license:${code}`,
  slots: (publicLink: string) => `slots:${publicLink}`,
  user: (userId: string) => `user:${userId}`,
};

/**
 * Limpar cache específico (útil quando dados são atualizados)
 */
export const clearCache = {
  license: (code: string) => licenseCache.del(getCacheKey.license(code)),
  slots: (publicLink: string) => slotsCache.del(getCacheKey.slots(publicLink)),
  user: (userId: string) => userCache.del(getCacheKey.user(userId)),
  
  // Limpar todos os caches de um tipo
  allLicenses: () => licenseCache.flushAll(),
  allSlots: () => slotsCache.flushAll(),
  allUsers: () => userCache.flushAll(),
};

/**
 * Estatísticas dos caches (útil para monitoramento)
 */
export const getCacheStats = () => ({
  license: licenseCache.getStats(),
  slots: slotsCache.getStats(),
  user: userCache.getStats(),
});








