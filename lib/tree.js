const path = require("path")
const utils = require("./utils")
const treeData = require("./treeData")
const treeExpand = require("./treeExpand")

function Node(nodePath, data, evalVars) {
  this.path = nodePath
  this.data = data
  this.evalVars = evalVars

  this.parent = null
  this.children = {}

  this.addChild = function(node) {
    this.children[node.path] = node
    node.parent = this
  }

  this.delChild = function(node) {
    delete this.children[node.path]
    node.parent = null
  }

  this.getChildren = function() {
    return Object.values(this.children)
  }

  this.getData = function(key) {
    let val = this.data[key]

    if (val !== undefined) {
      return val
    }

    if (this.parent === null) {
      throw `Cannot find data key "${key}" in "${this.path}"`
    }

    return this.parent.getData(key)
  }

  this.mergeData = function() {
    let dataArray = []
    let node = this

    while (node !== null) {
      dataArray.push(node.data)
      node = node.parent
    }

    return utils.merge(...dataArray.reverse())
  }

  this.walk = function(fn) {
    fn(this)

    for (var child of this.getChildren()) {
      child.walk(fn)
    }
  }

  this.rebaseCopy = function(dstPath) {
    let srcPath = this.path

    function _walk(node) {
      let copy = new Node(node.path, {...node.data}, node.evalVars)
      copy.path = node.path.replace(srcPath, dstPath)

      for (const child of node.getChildren()) {
        copy.addChild(_walk(child))
      }

      return copy
    }

    return _walk(this)
  }
}

function Tree() {
  this.nodes = {}
  this.copyThrough = []

  this.getNode = function(nodePath) {
    return this.nodes[nodePath]
  }

  this.addNode = function(node) {
    if (node.path !== "") {
      let parent = this.getNode(utils.dirname(node.path))
      parent.addChild(node)
    }
    node.walk(n => this.nodes[n.path] = n)
  }

  this.delNode = function(node) {
    node.walk(n => delete this.nodes[n.path])
    node.parent.delChild(node)
  }

  this.getRoot = function() {
    return this.getNode("")
  }

  this.getPageNodes = function() {
    return Object.values(this.nodes)
      .filter(n => treeData.isPageData(n.data))
  }
}

async function genTreeData(srcDir) {
  let tree = new Tree()

  await utils.walkPath(srcDir, async (pathName, stats) => {
    let data

    if (stats.isDirectory()) {
      data = treeData.readDirData(srcDir, pathName, tree)
    } else {
      data = await treeData.readPageData(srcDir, pathName, tree)
    }

    if (data === undefined) {
      return true
    }

    let relPath = path.relative(srcDir, pathName)
    let evalVars = data._evalVars
    delete data._evalVars

    tree.addNode(new Node(relPath, data, evalVars))
    return false
  })

  treeExpand.expand(tree)
  return tree
}

module.exports = {
  genTreeData,
}
