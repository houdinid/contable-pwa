// ESLint 9 Flat Config
export default [
  {
    ignores: [
      "**/*.ts",
      "**/*.tsx",
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {}
  }
];
