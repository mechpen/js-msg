const fs = require("fs")
const path = require("path")
const utils = require("./utils")
const pathTemplate = require("./pathTemplate")

// fs.cpSync has problem with symlinks, thus the following
function cpSync(srcPath, dstPath) {
  console.log(`Copying ${dstPath} ...`)

  utils.walkPath(srcPath, (src, stats) => {
    if (stats.isDirectory()) {
      return false
    }

    let rel = path.relative(srcPath, src)
    let dst = path.join(dstPath, rel)

    fs.mkdirSync(utils.dirname(dst), {recursive: true})

    if (stats.isSymbolicLink()) {
      fs.rmSync(dst, {force: true})
      fs.symlinkSync(fs.readlinkSync(src), dst)
    } else {
      fs.copyFileSync(src, dst)
    }
  })
}

function copyThrough(tree, srcDir, dstDir) {
  for (const copyPath of tree.copyThrough) {
    let srcPath = path.join(srcDir, copyPath)
    for (const dst of pathTemplate.expand(copyPath, tree)) {
      let dstPath = path.join(dstDir, dst.path)
      cpSync(srcPath, dstPath)
    }
  }
}

module.exports = {
  copyThrough,
}
