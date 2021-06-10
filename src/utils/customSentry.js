import * as Sentry from "@sentry/node";

export async function sentryException(error, email) {
  Sentry.withScope(function (scope) {
    scope.setUser({
      email: email,
    });
    Sentry.captureException(error);
  });
}
