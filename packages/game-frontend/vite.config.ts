import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";
// import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";
// import compressionPlugin from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: ["**/*.glsl"],
      defaultExtension: "glsl",
      warnDuplicatedImports: true,
      minify: true,
    }),
    // compressionPlugin(),
    // obfuscatorPlugin({
    //   options: {
    //     compact: true,
    //     controlFlowFlattening: true,
    //     sourceMap: false,
    //     stringArray: true,
    //     stringArrayEncoding: ["rc4"],
    //     stringArrayThreshold: 1,
    //     unicodeEscapeSequence: false,
    //   },
    // }),
  ],
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d-compat"],
  },
  resolve: {
    alias: [
      {
        find: "@mansion/shared",
        replacement: fileURLToPath(new URL("../shared/src", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: ["5001.gche.me"],
  },
});
