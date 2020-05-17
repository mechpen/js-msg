# js-msg

Minimalist static site generator.

This tool is a general purpose template renderer, with a
[plugin](https://github.com/mechpen/js-msg/blob/master/plugins/blog/index.js)
to generate static blog sites.  To generate a blog site from `srcDir`
to `dstDir`:

```
npm install js-msg
npx js-msg srcDir dstDir
```

The core of the tool does 2 things in order:

  1. recursively merge data defined in a directory, and

  2. recursively render [liquid] templates using the data from step 1.

## Data merging

A directory could have a file `.data.yaml` that defines data at the
directory level.  A file could define data in its front matter as in
[jelyll](https://jekyllrb.com/docs/front-matter/).  Directory data and
file data are merged to get the data to rendering the file.

Data merging follows the "longest prefix rule".  When there are
conflicting keys, the value associates with the longest prefix of the
path wins.

If the values of a conflicting key are arrays, then the arrays are
concatenated with duplicates removed.

## Page rendering

The variable `template` of a file specifies the [liquid] template of
this file.  The rendering is performed recursively until the
`template` variable is not defined or `null`.

Before rendering a template, the template data and source data are
merged.  The source data takes precedence over the template data.

## Special data keys

The following data keys have special meanings, and should not be used
for other purposes:

| key           | description |
| ------------- | ----------- |
| `srcDir`      | source dir |
| `dstDir`      | destination dir |
| `source`      | source file path, relative to `srcDir` |
| `content`     | page content |
| `current`     | current rendering file path, could be `source` or a template file |
| `allpages`    | list of all pages data |
| `template`    | template of a file |
| `templateDir` | dir to look for template, relative to the current file dir |
| `copyThrough` | dir or file to copy through, relative to the `.data.yaml` file dir |

## Config file

Config file is a javascript file.  It is specified with the command
argument `--config` with default value `.js-msg.js`.

The config file should export a function that take a config object.
The config object contains the following:

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
    For example, the value of ".md" is a function to convert markdown
    to html.

The processor function has prototype `(content, data) => newContent`.
`data` is modified in place.  A `null` processor is the same as `(x)
=> x`.

As an example, the "blog" plugin is implemented as a [config
file](https://github.com/mechpen/js-msg/blob/master/plugins/blog/index.js).

## File mappings

Page source files are collected from `srcDir`.  Files under
`templateDir` and `copyThrough` are skipped.  Files with extensions in
the `exts` map is selected.

Page output files are created in `dstDir` with the same relative path
as source files.  The output file extension is the extension of the
last template file used to generate the output.

The files or dirs listed in `copyThrough` are copied from `srcDir` to
`dstDir` with the same relative path.

## Full example

https://github.com/mechpen/mechpen.github.io

[liquid]: https://shopify.github.io/liquid/
