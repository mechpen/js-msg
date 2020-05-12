const fs = require("fs")
const path = require("path")
const ncp = require("ncp")

const dateRe = /^(\d{4}-\d{2}-\d{2})-.*/

function guessDate(url) {
  for (const name of url.split("/")) {
    let mo = name.match(dateRe)
    if (mo !== null) {
      return Date.parse(mo[1])
    }
  }
}

function trimPath(pathName) {
  if (pathName[-1] === path.sep) {
    pathName = pathName.slice(0, -1)
  }
  if (pathName === ".") {
    pathName = ""
  }
  return pathName
}

function stemname(pathName) {
  let ext = path.extname(pathName)
  if (ext !== "") {
    pathName = pathName.slice(0, -ext.length)
  }
  return pathName
}

function walkPath(pathName, fn) {
  if (fn(pathName) === true) {
    return
  }

  if (fs.statSync(pathName).isDirectory()) {
    fs.readdirSync(pathName).forEach((name) => {
      walkPath(path.join(pathName, name), fn)
    })
  }
}

function updateObj(old, neo) {
  Object.keys(neo).forEach((key) => {
    let oldV = old[key]
    let neoV = neo[key]

    if (Array.isArray(oldV) && Array.isArray(neoV)) {
      old[key] = neoV.concat(oldV)
    } else if (typeof oldV === "object" && typeof neoV === "object") {
      mergeOld(oldV, neoV)
    } else {
      old[key] = neoV
    }
  })
}

function mergeLeft(...args) {
  left = {}
  args.forEach((x) => updateObj(left, x))
  return left
}

function cpDir(src, dst) {
  fs.mkdirSync(path.dirname(dst), {recursive: true})

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
  guessDate,
  trimPath,
  stemname,
  walkPath,
  mergeLeft,
  cpDir,
}
