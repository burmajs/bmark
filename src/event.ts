type EventParams = {
  regexp?: RegExp;
  matches?: any; //TODO
  options?: Object; //TODO
  converter?: any; //TODO
  globals?: Object; //TODO
  parsedText?: string;
};
export function event(evtName: string, text: string, params?: EventParams) {
  const regexp = params?.regexp ?? null;
  const matches = params?.matches ?? {};
  const options = params?.options ?? {};
  const converter = params?.converter ?? {};
  const globals = params?.globals ?? {};
  const getEventName = (): string => evtName;
  const getText = (): string => text;
  const setText = (newText: string): string => (text = newText);
  return {
    getEventName,
    getText,
    setText,
  };
}
