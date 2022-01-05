const tree = require("./tree")
const copy = require("./copy")
const render = require("./render")
const config = require("./config")

async function genSite(srcDir, dstDir) {
  let treeData = await tree.genTreeData(srcDir)

  await render.renderPages(treeData, srcDir, dstDir)
  copy.copyThrough(treeData, srcDir, dstDir)
  console.log("Done")
}

module.exports = {
  runConfig: config.runConfig,
  genSite: genSite,
}
