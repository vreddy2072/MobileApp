module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  ignorePatterns: ["/dist/*", "nativewind-env.d.ts"],
  rules: {
    "prettier/prettier": "error",
    "import/first": "off",
  },
};

