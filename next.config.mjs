/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {hostname:"rosy-peccary-101.convex.cloud"},
            { hostname: "oaidalleapiprodscus.blob.core.windows.net" },
        ]
    }
};

export default nextConfig;
