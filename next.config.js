/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      enabled: false // Disable Turbo for now to ensure styles work correctly
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  },
}
