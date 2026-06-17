// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function ensureString(
  value: string | undefined,
  defaultValue: string = ''
): string {
  return value || defaultValue;
}
