module.exports = {
  process(sourceText) {
    return sourceText.replace(
      /import\.meta\.env\.VITE_API_BASE_URL/g,
      "'http://localhost:3000/api'"
    );
  },
};