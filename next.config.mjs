/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Сжатие
  compress: true,
  // Оптимизация для продакшена
  poweredByHeader: false,
  // Размер страниц
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default nextConfig;