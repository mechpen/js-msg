const fs = require("fs")
const path = require("path")
const ncp = require("ncp")

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
  if (await fn(pathName) === true) {
    return
  }

  if (fs.statSync(pathName).isDirectory()) {
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

function cp(src, dst) {
  return new Promise((resolve, reject) => {
    ncp.ncp(src, dst, function (err) {
      if (err !== null) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = {
  dirname,
  stemname,
  walkPath,
  merge,
  cp,
}
