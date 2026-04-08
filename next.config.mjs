/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // Keep heavy server-only packages out of the client bundle
    serverExternalPackages: ['nodemailer'],
    // Next.js 16 uses Turbopack by default; declare an empty config to satisfy the check.
    // The fs:false fallback is not needed with Turbopack (TensorFlow is dynamically imported).
    turbopack: {},
};

export default nextConfig;
