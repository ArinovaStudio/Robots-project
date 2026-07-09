import { Filter } from 'bad-words';

const filter = new Filter();

export const validateTextContent = (text: string | null) => {
  if (!text) return { isValid: true, sanitizedText: null };

  const isProfane = filter.isProfane(text);
  
  return {
    isValid: !isProfane,
    sanitizedText: isProfane ? filter.clean(text) : text,
  };
};