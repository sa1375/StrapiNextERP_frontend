// lib/handleApiError.ts

export function handleApiError(
  error: any,
  defaultMessage = "something went wrong"
): string {
  if (!error) return defaultMessage;

  // strapi formated errors
  if (error?.response?.data?.error?.message)
    return error.response.data.error.message;

  // strapi new error format
  if (error?.error?.message) return error.error.message;

  // axios network error
  if (error?.message) return error.message;

  return defaultMessage;
}
