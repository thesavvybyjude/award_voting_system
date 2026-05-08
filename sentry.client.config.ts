import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.5,

  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (process.env.NODE_ENV === "production") {
      return event;
    }
    return null;
  },
});
