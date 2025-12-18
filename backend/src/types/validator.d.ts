declare module 'validator' {
  const validator: {
    isEmail: (input: string) => boolean;
    isMobilePhone: (input: string, locale?: string | string[]) => boolean;
    trim: (input: string) => string;
    escape: (input: string) => string;
    normalizeEmail: (input: string) => string | false | null | undefined;
  };

  export default validator;
}


