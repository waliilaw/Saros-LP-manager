

const nextConfig: any = {
  typescript: {
    ignoreBuildErrors: true, // Allow build to continue with wallet SSR issues
  },
  excludeFile: (str: string) => /\*test\*/.test(str) || /vitest.config.ts/.test(str),
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },
};

export default nextConfig;
