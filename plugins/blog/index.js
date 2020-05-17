const path = require("path")

const dateRe = /^(\d{4}-\d{2}-\d{2})-.*/

function guessDate(url) {
  for (const name of url.split("/").reverse()) {
    let mo = name.match(dateRe)
    if (mo !== null) {
      return Date.parse(mo[1])
    }
  }
}

function addData(content, data) {
  let url = data.source.replace(".md", ".html")
  if (path.extname(url) !== ".html") {
    throw "Invalid source file extension: " + data.source
  }

  data.url = "/" + url.split(path.sep).join("/")
  data.date = guessDate(data.url)

  return content
}

module.exports = (config) => {
  let oldpre = config.processors.pre
  config.processors.pre = async (content, data) => {
    return addData(await oldpre(content, data), data)
  }

  let md = require("markdown-it")()
  config.processors.exts = {
    // eslint-disable-next-line no-unused-vars
    ".md": (content, data) => md.render(content),
    ".html": null,
  }
}
