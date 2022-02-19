# js-msg

Minimalist static site generator.  Supports pagination,
category/tagging, and etc.

This tool is a general purpose template renderer, with a
[plugin](https://github.com/mechpen/js-msg/blob/master/plugins/blog/index.js)
to generate static blog sites.  To generate a blog site from `srcDir`
to `dstDir`:

```
npm install js-msg
npx js-msg srcDir dstDir
```

## Example

[Here](example) is an blog example that has pagination and categories.

## Design

The core of the tool does 2 things in order:

  1. recursively merge data defined in a directory, and

  2. recursively render [liquid] templates using the data from step 1.

Pagination and tagging are implemented using 2 mechanisms:

  1. `_evalVars` defines variables that are evaluated in js, and

  2. generating paths from templates and variables.

## Data merging

A directory could have a file `_data.yaml` that defines data at the
directory level.  A file could define data in its front matter as in
[jelyll](https://jekyllrb.com/docs/front-matter/).  Directory data and
file data are merged to get the rendering data.

Data merging follows the "longest prefix rule".  When there are
conflicting keys, the value associates with the longest prefix of the
path wins.

## Page rendering

The variable `_template` of a file specifies the [liquid] template of
this file.  The rendering is performed recursively until the
`_template` variable is not defined.

Before rendering a template, the template data and source data are
merged.  The source data takes precedence over the template data.

## Special data keys

The following data keys have special meanings, and should not be used
for other purposes:

| key            | description |
| -------------- | ----------- |
| `_srcDir`      | source dir |
| `_dstDir`      | destination dir |
| `_source`      | source file path, relative to `_srcDir` |
| `_current`     | current rendering file path, could be `_source` or a template file |
| `_body`        | template body |
| `_input`       | template input, or result of the previous template |
| `_template`    | template of a file |
| `_templateDir` | dir to look for template, relative to the current file dir |
| `_copyThrough` | dirs or files to copy through, relative to the `_data.yaml` file dir |
| `_srcPages`    | list of all source pages |
| `_evalVars`    | variables that are evalulated in js. `_evalVars` are not merged |

## Pagination and Tagging

Pagination and tagging can be implemented using `_evalVars` and
"path template".  For [example](example/src/page/), define
the page number list variable `pn_list`:

```
_evalVars:
  - pn_list: _.range(1, 1+Math.ceil(_srcPages.length/10))
```

Then the path name `@pn` is expanded to `1`, `2`, and etc.  In
`@pn/index.html`, define the `posts` variable as:

```
_evalVars:
  - posts: _srcPages.slice((pn-1)*10, pn*10)
```

The [underscore](https://underscorejs.org/) library is imported to the
eval context for convenience.

## Config file

The config file is a javascript file.  It is specified with the command
argument `--config` with default value `.js-msg.js`.

The config javascript file should export a function that take a config
object.  The config object contains the following:

- `addLiquidTag`: a function to create a new liquid Tag.  Some
  examples are
  [here](https://github.com/mechpen/mechpen.github.io/blob/src/.js-msg.js#L6-L7)

- `processors`: an object that contains the following.  The values can
  be updated by the user config function.

  - `pre`: a function to preprocess source pages

  - `post`: a function to postprocess output pages after all rendering
    is complete.

  - `exts`: a map from file extensions to processors.  A processor is
    run after a file with the corresponding extension is rendered.
    For example, the value of `.md` is a function to convert markdown
    to html.

The processor function has prototype `(content, data) => newContent`.
`data` is modified in place.  A `null` processor is the same as `(x)
=> x`.

As an example, the "blog" plugin is implemented as a [config
file](https://github.com/mechpen/js-msg/blob/master/plugins/blog/index.js).

## File mappings

Page source files are collected from `_srcDir`.  Files under
`_templateDir` and `_copyThrough` are skipped.  Files with extensions
in the `exts` map are collected.

Page output files are created in `_dstDir` with the same relative path
as their source files.  The output file extension is the extension of
the last template file used to generate the output.

The files or dirs listed in `_copyThrough` are copied from `_srcDir` to
`_dstDir` with the same relative path.

[liquid]: https://shopify.github.io/liquid/
