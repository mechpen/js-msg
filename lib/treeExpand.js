const utils = require("./utils")
const pathTemplate = require("./pathTemplate")

function expandEvalVars(node) {
  if (node.evalVars === undefined) {
    return
  }

  let _ = require("underscore")  // eslint-disable-line
  let data = node.mergeData()

  for (const key of Object.keys(data)) {
    eval(`var ${key} = data.${key}`)
  }

  for (const item of node.evalVars) {
    for (const key of Object.keys(item)) {
      try {
        eval(`var ${key} = ${item[key]}; node.data.${key} = ${key}`)
      } catch (err) {
        throw `error with evalVar "${key}" in "${node.path}": ${err}`
      }
    }
  }
}

function expandNode(node, tree) {
  if (pathTemplate.isTemplate(node.path)) {
    for (const p of pathTemplate.expand(node.path, tree)) {
      let n = node.rebaseCopy(p.path)
      n.data = utils.merge(n.data, p.data)

      tree.addNode(n)
      expandNode(n, tree)
    }

    tree.delNode(node)
    return
  }

  expandEvalVars(node)

  for (var child of node.getChildren()) {
    expandNode(child, tree)
  }
}

function expand(tree) {
  let root = tree.getRoot()
  root.data._srcPages = tree.getPageNodes().map(n => n.mergeData())

  expandNode(root, tree)
}

module.exports = {
  expand,
}
