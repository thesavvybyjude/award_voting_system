import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    clientTraceMetadata: [],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
