import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdfkit-next'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
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

    return config;
  },
};

export default nextConfig;
