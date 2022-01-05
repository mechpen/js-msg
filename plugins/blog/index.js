const path = require("path")

const dateRes = [
  /\/(\d{4})-(\d{2})-(\d{2})-/,
  /\/(\d{4})\/(\d{2})-(\d{2})-/,
  /\/(\d{4})\/(\d{2})\/(\d{2})-/,
]

function guessDate(url) {
  for (const re of dateRes) {
    let mo = url.match(re)
    if (mo !== null) {
      return new Date(mo[1], mo[2]-1, mo[3])
    }
  }
}

function addData(content, data) {
  let url = data._source.replace(".md", ".html")
  if (path.extname(url) !== ".html") {
    throw "Invalid source file extension: " + data._source
  }

  data.url = "/" + url.split(path.sep).join("/")
  data.url = data.url.replace(/index\.html$/, "")
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
