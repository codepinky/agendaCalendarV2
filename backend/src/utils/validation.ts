import validator from 'validator';

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const validatePhone = (phone: string): boolean => {
  // Brazilian phone format: (00) 00000-0000 or (00) 0000-0000
  const phoneRegex = /^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/;
  return phoneRegex.test(phone) || validator.isMobilePhone(phone, 'pt-BR');
};

export const validateDate = (date: string): boolean => {
  // YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const validateTime = (time: string): boolean => {
  // HH:mm format
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const sanitizeString = (str: string): string => {
  return validator.escape(validator.trim(str));
};

export const sanitizeEmail = (email: string): string => {
  return validator.normalizeEmail(email) || email;
};















