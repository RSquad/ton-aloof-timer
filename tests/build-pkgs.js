const fs = require("fs");
const rimraf = require("rimraf");

const packageNames = ["Aloof", "TimerClient"];

const dir = "./pkgs";

rimraf.sync(`${dir}`);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const buildPkg = (name) => {
  return {
    name,
    abi: JSON.parse(fs.readFileSync("../src/" + name + ".abi.json", "utf8")),
    imageBase64: fs.readFileSync("../src/" + name + ".tvc").toString("base64"),
  };
};

packageNames
  .map((name) => buildPkg(name))
  .forEach((pkg) => {
    fs.writeFileSync(
      `./pkgs/${pkg.name}.pkg.ts`,
      `
        export default ${JSON.stringify(pkg)}
    `
    );
  });
