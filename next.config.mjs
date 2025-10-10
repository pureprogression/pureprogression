/** @type {import('next').NextConfig} */
const nextConfig = {
  // Настройка для турбопака
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Оптимизация изображений
  images: {
    domains: ['localhost'],
  },
  // Сжатие
  compress: true,
  // Оптимизация для продакшена
  poweredByHeader: false,
  // Размер страниц
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Настройка для разработки
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;