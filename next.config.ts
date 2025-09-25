

const nextConfig: any = {
  typescript: {
    ignoreBuildErrors: false,
  },
  excludeFile: (str: string) => /\*test\*/.test(str) || /vitest.config.ts/.test(str),
};

export default nextConfig;
