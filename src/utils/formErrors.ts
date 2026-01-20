import { FieldValues, UseFormSetError } from 'react-hook-form';

type FieldErrorsMap = Record<string, string | string[]>;

const normalizeFieldErrors = (error: any): FieldErrorsMap | null => {
  const details = error?.details ?? error?.response?.data?.details ?? error?.response?.data;
  const fields =
    details?.fields ||
    details?.errors ||
    details?.validationErrors ||
    error?.errors ||
    null;

  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    return fields as FieldErrorsMap;
  }

  if (Array.isArray(fields)) {
    return fields.reduce<FieldErrorsMap>((acc, item) => {
      const key = item?.field || item?.path;
      const message = item?.message || item?.error;
      if (key && message) {
        acc[key] = message;
      }
      return acc;
    }, {});
  }

  return null;
};

export const applyApiFieldErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): boolean => {
  const fieldErrors = normalizeFieldErrors(error);
  if (!fieldErrors) return false;

  Object.entries(fieldErrors).forEach(([field, message]) => {
    const normalizedMessage = Array.isArray(message) ? message[0] : message;
    if (normalizedMessage) {
      setError(field as keyof T, { message: normalizedMessage });
    }
  });

  return Object.keys(fieldErrors).length > 0;
};
