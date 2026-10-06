export function signupErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code) : "";
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account already exists for this email. Please use a different email or return to Hi5.";
    case "email_address_invalid":
    case "validation_failed":
      return "Please check your email address and account details.";
    case "weak_password":
      return "Please choose a stronger password with at least 8 characters.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes before trying again.";
    case "signup_disabled":
      return "Signup is temporarily unavailable. Please try again later.";
    case "unexpected_failure":
      return "We could not finish setting up your profile. Please try again later.";
  }
  if (error instanceof Error && error.message === "Signup is not configured yet. Please try again later.") {
    return error.message;
  }
  if (error instanceof TypeError || (typeof error === "object" && error !== null && "name" in error && error.name === "AuthRetryableFetchError")) {
    return "We could not reach Hi5. Check your internet connection and try again.";
  }
  return "We could not create your account. Please try again later. If you already signed up, check your email for a confirmation link.";
}
