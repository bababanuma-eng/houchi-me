import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// リポジトリ直下の package.json があると Turbopack が workspace root を誤推定するため明示
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.33.198"],
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
