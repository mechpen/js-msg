const utils = require("./utils")
const varRe = /@([A-Za-z]+)/

function PathTemplate(templateStr, templateData) {
  this.path = templateStr
  this.data = templateData
}

function expand(templateStr, tree) {
  let todo = [new PathTemplate(templateStr, {})]
  let done = []

  for (;;) {
    if (todo.length === 0) {
      break
    }

    let template = todo.pop()
    let mo = template.path.match(varRe)
    if (mo === null) {
      done.push(template)
      continue
    }

    let varMatch = mo[0]
    let varName = mo[1]
    let varListName = mo[1] + "_list"

    // mo.index + 1 to include '@' as part of basename
    let parentPath = utils.dirname(template.path.slice(0, mo.index+1))
    let parentNode = tree.getNode(parentPath)

    for (const val of parentNode.getData(varListName)) {
      let templateStr = template.path.replace(varMatch, val)
      let templateData = {...template.data}
      templateData[varName] = val
      todo.push(new PathTemplate(templateStr, templateData))
    }
  }

  if (done.length === 0) {
    throw `expandPath "${templateStr}" returned 0 path`
  }
  return done
}

function isTemplate(pathName) {
  return pathName.match(varRe) !== null
}

module.exports = {
  expand,
  isTemplate,
}
