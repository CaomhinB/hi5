export function loginErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  switch (code) {
    case "invalid_credentials":
      return "The email or password is incorrect. Please try again.";
    case "email_not_confirmed":
      return "Please confirm your email using the link in your inbox, then log in.";
    case "email_address_invalid":
    case "validation_failed":
      return "Please enter a valid email address and your password.";
    case "over_request_rate_limit":
      return "Too many login attempts. Please wait a few minutes before trying again.";
    case "user_banned":
      return "Login is unavailable for this account.";
    case "email_provider_disabled":
      return "Email login is currently unavailable. Please try again later.";
  }
  if (error instanceof Error && /not configured/i.test(error.message)) {
    return "Login isn’t configured yet. Please try again later.";
  }
  if (error instanceof TypeError || (typeof error === "object" && error !== null
    && "name" in error && error.name === "AuthRetryableFetchError")) {
    return "We couldn’t reach Hi5. Check your connection and try again.";
  }
  return "We couldn’t log you in. Please try again later.";
}
