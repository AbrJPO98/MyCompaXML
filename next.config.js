/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Forzar renderizado dinámico para todas las páginas
  staticPageGenerationTimeout: 0,
  // Configurar para evitar problemas de generación estática
  output: 'standalone',
  // Configurar webpack para ignorar warnings de Mongoose
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      })
    }
    return config
  },
}

module.exports = nextConfig 