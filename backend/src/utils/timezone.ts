/**
 * Utilitários para trabalhar com timezone America/Sao_Paulo (UTC-3)
 * 
 * O sistema de agendamento usa o fuso horário de São Paulo para todas as operações
 * de data e hora, garantindo consistência independente de onde o servidor está rodando.
 */

import { logger } from './logger';

const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data atual no formato YYYY-MM-DD no fuso horário de São Paulo
 */
export function getTodayInSaoPaulo(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const today = formatter.format(now);
  return today;
}

/**
 * Retorna a data e hora atual completa no fuso horário de São Paulo
 */
export function getCurrentDateTimeInSaoPaulo(): Date {
  // Criar uma string ISO com o timezone de São Paulo
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const second = parts.find(p => p.type === 'second')?.value || '';
  
  // Criar Date object no timezone local que representa o mesmo momento em São Paulo
  // Usar uma string ISO que será interpretada como local
  const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  return new Date(dateString);
}

/**
 * Verifica se um slot (data + hora) já passou no fuso horário de São Paulo
 * 
 * @param slot - Slot com propriedades date (YYYY-MM-DD) e startTime (HH:mm)
 * @returns true se o slot já passou, false caso contrário
 */
export function isSlotInPast(slot: { date: string; startTime: string }): boolean {
  const now = new Date();
  
  // Obter data atual em São Paulo
  const nowDateStr = getTodayInSaoPaulo();
  
  // Obter hora atual em São Paulo usando formatter
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const timeParts = timeFormatter.formatToParts(now);
  const nowHour = timeParts.find(p => p.type === 'hour')?.value || '00';
  const nowMinute = timeParts.find(p => p.type === 'minute')?.value || '00';
  const nowTimeStr = `${nowHour.padStart(2, '0')}:${nowMinute.padStart(2, '0')}`;
  
  // Garantir que a data do slot está no formato correto (YYYY-MM-DD)
  // Remover espaços e normalizar formato se necessário
  let slotDate = slot.date.trim();
  const originalSlotDate = slotDate;
  if (slotDate.includes('/')) {
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    const parts = slotDate.split('/').map(p => p.trim());
    if (parts.length === 3) {
      slotDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  // Validar formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) {
    logger.error('Formato de data inválido em isSlotInPast', {
      originalDate: originalSlotDate,
      normalizedDate: slotDate,
      slotStartTime: slot.startTime,
    });
    // Se não conseguir normalizar, assumir que está no passado para segurança
    return true;
  }
  
  logger.info('Verificando se slot está no passado', {
    slotDate: originalSlotDate,
    normalizedDate: slotDate,
    slotStartTime: slot.startTime,
    today: nowDateStr,
    nowTime: nowTimeStr,
  });
  
  // Comparar datas primeiro (formato YYYY-MM-DD permite comparação de strings)
  // Exemplo: "2025-12-27" < "2025-12-28" retorna true
  const dateComparison = slotDate.localeCompare(nowDateStr);
  if (dateComparison < 0) {
    logger.info('Slot está no passado (data anterior)', {
      slotDate,
      today: nowDateStr,
      result: true,
    });
    return true; // Data já passou
  }
  
  if (dateComparison > 0) {
    logger.info('Slot está no futuro (data futura)', {
      slotDate,
      today: nowDateStr,
      result: false,
    });
    return false; // Data ainda não chegou
  }
  
  // Mesma data, comparar horários numericamente para garantir comparação correta
  // Converter horários para minutos desde meia-noite para comparação precisa
  const timeToMinutes = (time: string): number => {
    // Normalizar o horário: remover espaços e garantir formato HH:mm
    const normalizedTime = time.trim();
    if (!/^\d{1,2}:\d{2}$/.test(normalizedTime)) {
      logger.error('Formato de horário inválido', { time, normalizedTime });
      return 0;
    }
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      logger.error('Valores de horário inválidos', { time, normalizedTime, hours, minutes });
      return 0;
    }
    return hours * 60 + minutes;
  };
  
  // Normalizar o horário do slot antes de converter
  const normalizedSlotTime = slot.startTime.trim();
  const slotMinutes = timeToMinutes(normalizedSlotTime);
  const nowMinutes = timeToMinutes(nowTimeStr);
  
  // Se não conseguiu converter, assumir que está no passado para segurança
  if (slotMinutes === 0 && normalizedSlotTime !== '00:00') {
    logger.error('Não foi possível converter horário do slot', {
      slotStartTime: slot.startTime,
      normalizedSlotTime,
    });
    return true; // Assumir que está no passado para segurança
  }
  
  const result = slotMinutes < nowMinutes;
  logger.info('Slot na mesma data - comparando horários', {
    slotDate,
    slotStartTime: slot.startTime,
    normalizedSlotTime,
    slotMinutes,
    nowTime: nowTimeStr,
    nowMinutes,
    isPast: result,
  });
  
  // Se o horário do slot é menor que o horário atual, o slot já passou
  // Se o horário do slot é igual ou maior, o slot ainda não passou (pode estar começando agora)
  return result;
}

/**
 * Converte uma data e hora de São Paulo para um objeto Date
 * Útil para comparações e cálculos
 * 
 * @param date - Data no formato YYYY-MM-DD
 * @param time - Hora no formato HH:mm
 * @returns Date object representando a data/hora em São Paulo
 */
export function parseSaoPauloDateTime(date: string, time: string): Date {
  // Criar string no formato ISO que será interpretada como local
  // Assumindo que o servidor está configurado para o mesmo timezone ou UTC
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Criar Date assumindo que é no timezone local
  // Nota: Isso funciona porque estamos apenas comparando, não precisamos
  // do timezone exato, apenas da ordem temporal
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Converte uma data e hora de São Paulo para um Timestamp do Firestore
 * Útil para armazenar no Firestore e permitir queries eficientes
 * 
 * @param date - Data no formato YYYY-MM-DD
 * @param time - Hora no formato HH:mm
 * @returns FirebaseFirestore.Timestamp representando a data/hora em São Paulo
 */
export function parseSaoPauloDateTimeToTimestamp(date: string, time: string) {
  const dateTime = parseSaoPauloDateTime(date, time);
  const { Timestamp } = require('firebase-admin/firestore');
  return Timestamp.fromDate(dateTime);
}

