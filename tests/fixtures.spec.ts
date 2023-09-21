import { describe, expect, it } from "vitest"
import fs from "node:fs"
import katex from "katex"
import MarkdownIt from "markdown-it"
import dollarmathPlugin from "../src"

/** Read a "fixtures" file, containing a set of tests:
 *
 * test name
 * .
 * input text
 * .
 * expected output
 * .
 *
 * */
function readFixtures(name: string): string[][] {
  const fixtures = fs.readFileSync(`tests/fixtures/${name}.md`).toString()
  return fixtures.split("\n.\n\n").map(s => s.split("\n.\n"))
}

describe("Parses basic", () => {
  readFixtures("basic").forEach(([name, text, expected]) => {
    const mdit = MarkdownIt("commonmark").use(dollarmathPlugin, {
      allow_space: false,
      allow_digits: false,
      double_inline: true,
      allow_labels: true
    })
    const rendered = mdit.render(text)
    // console.log(rendered)
    it(name, () => expect(rendered.trim()).toEqual(expected.trim()))
  })

  readFixtures("katex").forEach(([name, text, expected]) => {
    const mdit = MarkdownIt("commonmark").use(dollarmathPlugin, {
      allow_space: false,
      allow_digits: false,
      double_inline: true,
      allow_labels: true,
      renderer: (content, { displayMode }) =>
        katex.renderToString(content, { throwOnError: false, displayMode })
    })
    let rendered = mdit.render(text)
    // remove styles
    rendered = rendered.replace(/style="[^"]+"/g, 'style=""')
    // console.log(rendered)
    it(name, () => expect(rendered.trim()).toEqual(expected.trim()))
  })
})

describe("Ensure parsing to mdast", () => {
  it("trims math content", () => {
    const mdit = MarkdownIt("commonmark").use(dollarmathPlugin, {
      allow_space: false,
      allow_digits: false,
      double_inline: true,
      allow_labels: true,
      renderer: (content, { displayMode }) =>
        katex.renderToString(content, { throwOnError: false, displayMode })
    })
    const tokens = mdit.parse("$$\na\n$$ (label)", {})
    expect(tokens[0].tag).toEqual("math")
    expect(tokens[0].content).toEqual("a")
    expect(tokens[0].markup).toEqual("$$")
    expect(tokens[0].info).toEqual("label")
    expect(tokens[0].block).toEqual(true)
  })
})
