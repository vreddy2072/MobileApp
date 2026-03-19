// Babel plugin to transform import.meta usage for non-module environments
module.exports = function() {
  return {
    name: "transform-import-meta",
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          // Replace import.meta with a safe fallback
          path.replaceWithSourceString('({ url: "" })');
        }
      }
    }
  };
};

