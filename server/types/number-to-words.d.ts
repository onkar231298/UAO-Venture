declare module "number-to-words" {
  const converter: {
    toWords(value: number | string): string;
    toOrdinal(value: number | string): string;
    toWordsOrdinal(value: number | string): string;
  };
  export default converter;
}
