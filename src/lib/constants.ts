// Mosque configuration
// For single mosque MVP: uses environment variable
// For future multi-mosque: will use dynamic routing from authenticated admin's mosque_id
export const DEFAULT_MOSQUE_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG || "anwaarul-islam-rondebosch-east";
