const fs = require("fs");
const path = require("path");

const directoryPath = path.join(__dirname, "public/js"); // or wherever your compiled files are

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.error("Unable to scan directory: " + err);
  }

  files.forEach(function (file) {
    const filePath = path.join(directoryPath, file);
    fs.readFile(filePath, "utf8", function (err, data) {
      if (err) {
        return console.error("Unable to read file: " + err);
      }

      const result = data.replace(/import\s*(?:(?:{[^}]*}\s+from)?)?\s*['"]([^'"]*)['"]\s*;?/g, (match, p1) => {
        let splitPath = p1.split('/');
        let fileName = splitPath.pop();
        let extension = fileName.split('.')[1];

        if (!extension || extension === 'ts') {
          fileName = (!extension) ? `${fileName}.js` : fileName.replace(/\.ts$/, '.js');
          let newPath = [...splitPath, fileName].join('/');
          return match.replace(p1, newPath);
        }

        return match;
      });

      fs.writeFile(filePath, result, "utf8", function (err) {
        if (err) {
          return console.error("Unable to write file: " + err);
        }
      });
    });
  });
});
