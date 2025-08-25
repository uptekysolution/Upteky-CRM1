import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  httpAgentOptions: { keepAlive: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Avoid Edge runtime issues by not marking Node-only packages as externals globally
  // serverExternalPackages: ['pdfkit-next'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:all*(css|js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Handle fontkit-next data files
    config.module.rules.push({
      test: /\.trie$/,
      type: 'asset/resource',
    });

    // Add fallback for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Ensure proper handling of binary files
    config.module.rules.push({
      test: /\.(trie|afm|ttf|otf)$/,
      type: 'asset/resource',
    });

    // More aggressive chunk splitting for large vendor libs
    if (!isServer && config.optimization && config.optimization.splitChunks) {
      const splitChunks = config.optimization.splitChunks;
      const cacheGroups = (splitChunks as any).cacheGroups || {};
      (splitChunks as any).cacheGroups = {
        ...cacheGroups,
        recharts: {
          test: /[\\/]node_modules[\\/](recharts)[\\/]/,
          name: 'vendor-recharts',
          chunks: 'all',
          priority: 20,
          enforce: true,
        },
        firebase: {
          test: /[\\/]node_modules[\\/](firebase)[\\/]/,
          name: 'vendor-firebase',
          chunks: 'all',
          priority: 15,
          enforce: true,
        },
      };
    }

    return config;
  },
};

export default nextConfig;
