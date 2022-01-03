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

function dedup(items) {
  let jsonItems = []
  let uniqItems = []

  for (const item of items) {
    let json = JSON.stringify(item, Object.keys(item).sort())
    if (jsonItems.includes(json)) {
      continue
    }
    jsonItems.push(json)
    uniqItems.push(item)
  }

  return uniqItems
}

function updateObj(old, neo) {
  for (const key of Object.keys(neo)) {
    let oldV = old[key]
    let neoV = neo[key]

    if (Array.isArray(oldV) && Array.isArray(neoV)) {
      old[key] = dedup(oldV.concat(neoV))
    } else if (typeof oldV === "object" && typeof neoV === "object") {
      updateObj(oldV, neoV)
    } else {
      old[key] = neoV
    }
  }
}

function merge(...args) {
  let merged = {}

  for (const arg of args) {
    updateObj(merged, arg)
  }

  return merged
}

// fs.cpSync has problem with symlinks, thus the following
function cpSync(relPath, srcDir, dstDir) {
  let srcPath = path.join(srcDir, relPath)
  walkPath(srcPath, (src, stats) => {
    if (stats.isDirectory()) {
      return false
    }

    let rel = path.relative(srcDir, src)
    let dst = path.join(dstDir, rel)

    fs.mkdirSync(dirname(dst), {recursive: true})

    if (stats.isSymbolicLink()) {
      fs.unlinkSync(dst)
      fs.symlinkSync(fs.readlinkSync(src), dst)
    } else {
      fs.copyFileSync(src, dst)
    }
  })
}

module.exports = {
  dirname,
  stemname,
  walkPath,
  merge,
  cpSync,
}
