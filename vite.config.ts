import "dotenv/config";
import { IMAGE_EXTENSIONS } from "./vite.constants";
import globals from "./globals";

export default {
  root: "src",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].bundle.[hash].js",
        chunkFileNames: "[name].chunk.bundle.[hash].js",
        assetFileNames: (assetInfo: any) => {
          if (assetInfo.name?.endsWith(".css")) {
            // Output CSS files directly to the root 'dist' folder,
            // otherwise the CSS files will be placed in the images folder
            return "[name].[hash].css";
          } else if (
            IMAGE_EXTENSIONS.some((ext) => assetInfo.name?.endsWith(ext))
          ) {
            // Output image files to the 'images' folder
            return `images/[name].[ext]`;
          } else {
            // For other assets (fonts, etc.), keep the original folder structure
            return `[name].[ext]`;
          }
        },
        dir: "dist",
      },
    },

    sourcemap: false,
    minify: true,
  },

  define: {
    ...globals,
  },
};
