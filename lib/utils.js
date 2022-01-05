const fs = require("fs")
const path = require("path")

// path.join() treats leading "." the same as "".
// So dirname() should return "" instead of "." to be
// consistent with path.join() and path.relative().
function dirname(pathName) {
  let dir = path.dirname(pathName)
  return dir === "." ? "" : dir
}

function stemname(pathName) {
  let ext = path.extname(pathName)
  if (ext === "") {
    throw `Path ${pathName} has no extension.`
  }
  return pathName.slice(0, -ext.length)
}

async function walkPath(pathName, fn) {
  let stats = fs.lstatSync(pathName)

  if (await fn(pathName, stats) === true) {
    return
  }

  if (stats.isDirectory()) {
    for (const name of fs.readdirSync(pathName)) {
      await walkPath(path.join(pathName, name), fn)
    }
  }
}

function merge(...args) {
  let merged = {}

  for (const arg of args) {
    for (const key of Object.keys(arg)) {
      merged[key] = arg[key]
    }
  }

  return merged
}

module.exports = {
  dirname,
  stemname,
  walkPath,
  merge,
}
