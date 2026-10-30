import { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    reactRouter(),
  ],
  ssr: {
    noExternal: [/@syncfusion/],
  },
});
