/* eslint-disable @typescript-eslint/no-explicit-any */
import type MarkdownIt from "markdown-it/lib"
import { escapeHtml } from "markdown-it/lib/common/utils"
import Renderer from "markdown-it/lib/renderer"
import type StateBlock from "markdown-it/lib/rules_block/state_block"
import type StateInline from "markdown-it/lib/rules_inline/state_inline"

export interface IRenderOptions {
  displayMode: boolean
}

export interface IOptions {
  /** Parse inline math when there is space after/before the opening/closing `$`, e.g. `$ a $` */
  allow_space?: boolean
  /** Parse inline math when there is a digit before/after the opening/closing `$`, e.g. `1$` or `$2` */
  allow_digits?: boolean
  /** Search for double-dollar math within inline contexts */
  double_inline?: boolean
  /** Capture math blocks with label suffix, e.g. `$$a=1$$ (eq1)` */
  allow_labels?: boolean
  /** function to normalize the label, by default replaces whitespace with `-` */
  labelNormalizer?: (label: string) => string
  /** The render function for math content */
  renderer?: (content: string, options: IRenderOptions) => string
  /** The render function for label content */
  labelRenderer?: (label: string) => string
}

const OptionDefaults: Required<IOptions> = {
  allow_space: true,
  allow_digits: true,
  double_inline: true,
  allow_labels: true,
  labelNormalizer(label) {
    return label.replace(/[\s]+/g, "-")
  },
  renderer(content) {
    return escapeHtml(content)
  },
  labelRenderer(label) {
    return `<a href="#${label}" class="mathlabel" title="Permalink to this equation">¶</a>`
  }
}

/**
 * A markdown-it plugin for parsing dollar delimited math,
 * e.g. inline: ``$a=1$``, block: ``$$b=2$$`
 */
export default function dollarmath_plugin(md: MarkdownIt, options?: IOptions): void {
  const fullOptions = { ...OptionDefaults, ...options }
  md.inline.ruler.before("escape", "math_inline", math_inline_dollar(fullOptions))
  md.block.ruler.before("fence", "math_block", math_block_dollar(fullOptions))

  const createRule =
    (
      opts: IRenderOptions & { inline?: boolean; hasLabel?: boolean }
    ): Renderer.RenderRule =>
    (tokens, idx) => {
      const content = tokens[idx].content.trim()
      let res: string
      try {
        res = fullOptions.renderer(content, { displayMode: opts.displayMode })
      } catch (err) {
        res = md.utils.escapeHtml(`${content}:${err.message}`)
      }
      const className = opts.inline ? "inline" : "block"
      const tag = opts.displayMode ? "div" : "span"
      const newline = opts.inline ? "" : "\n"
      const id = tokens[idx].info
      const label = opts.hasLabel ? `${fullOptions.labelRenderer(id)}` : ""
      return (
        [
          `<${tag} ${id ? `id="${id}" ` : ""}class="math ${className}">`,
          label,
          res,
          `</${tag}>`
        ]
          .filter(v => !!v)
          .join(newline) + newline
      )
    }

  md.renderer.rules["math_inline"] = createRule({
    displayMode: false,
    inline: true
  })
  md.renderer.rules["math_inline_double"] = createRule({
    displayMode: true,
    inline: true
  })
  md.renderer.rules["math_block"] = createRule({
    displayMode: true
  })
  md.renderer.rules["math_block_label"] = createRule({
    displayMode: true,
    hasLabel: true
  })
}

/** Test if dollar is escaped */
function isEscaped(state: StateInline, back_pos: number, mod = 0): boolean {
  // count how many backslashes are before the current position
  let backslashes = 0

  while (back_pos >= 0) {
    back_pos = back_pos - 1
    if (state.src.charCodeAt(back_pos) === 0x5c) {
      backslashes += 1
    } else {
      break
    }
  }

  if (backslashes === 0) {
    return false
  }

  // if an odd number of backslashes then ignore
  if (backslashes % 2 !== mod) {
    return true
  }

  return false
}

/** Generate inline dollar rule  */
function math_inline_dollar(
  options: IOptions
): (state: StateInline, silent: boolean) => boolean {
  /** Inline dollar rule:
   *
    - Initial check:
        - check if first character is a $
        - check if the first character is escaped
        - check if the next character is a space (if not allow_space)
        - check if the next character is a digit (if not allow_digits)
    - Advance one, if allow_double
    - Find closing (advance one, if allow_double)
    - Check closing:
        - check if the previous character is a space (if not allow_space)
        - check if the next character is a digit (if not allow_digits)
    - Check empty content
   *
  */
  function math_inline_dollar_rule(state: StateInline, silent: boolean): boolean {
    if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) {
      return false
    }
    if (!options.allow_space) {
      // whitespace not allowed straight after opening $
      if (state.md.utils.isWhiteSpace(state.src.charCodeAt(state.pos + 1))) {
        return false
      }
    }
    if (!options.allow_digits) {
      // digit not allowed straight before opening $
      const char = state.src.charAt(state.pos - 1)
      if (!!char && char.trim() !== "" && !isNaN(Number(char))) {
        return false
      }
    }
    if (isEscaped(state, state.pos)) {
      return false
    }
    // check if double dollar (if allowed)
    let is_double = false
    if (options.double_inline && state.src.charCodeAt(state.pos + 1) === 0x24) {
      is_double = true
    }
    // find closing $
    let pos = state.pos + 1 + (is_double ? 1 : 0)
    let found_closing = false
    let end = -1
    while (!found_closing) {
      end = state.src.indexOf("$", pos)
      if (end === -1) {
        return false
      }
      if (isEscaped(state, end)) {
        pos = end + 1
        continue
      }
      if (is_double && state.src.charCodeAt(end + 1) !== 0x24) {
        pos = end + 1
        continue
      }
      if (is_double) {
        end += 1
      }
      found_closing = true
    }
    if (!found_closing) {
      return false
    }
    if (!options.allow_space) {
      // whitespace not allowed straight before closing $
      const charCode = state.src.charCodeAt(end - 1)
      if (state.md.utils.isWhiteSpace(charCode)) {
        return false
      }
    }
    if (!options.allow_digits) {
      // digit not allowed straight after closing $
      const char = state.src.charAt(end + 1)
      if (!!char && char.trim() !== "" && !isNaN(Number(char))) {
        return false
      }
    }
    let text = state.src.slice(state.pos + 1, end)
    if (is_double) {
      text = state.src.slice(state.pos + 2, end - 1)
    }
    if (!text) {
      // ignore empty
      return false
    }
    if (!silent) {
      const token = state.push(
        is_double ? "math_inline_double" : "math_inline",
        "math",
        0
      )
      token.content = text
      token.markup = is_double ? "$$" : "$"
    }
    state.pos = end + 1
    return true
  }
  return math_inline_dollar_rule
}

/** Match a trailing label for a math block */
function matchLabel(lineText: string, end: number): { label?: string; end: number } {
  // reverse the line and match
  const eqnoMatch = lineText
    .split("")
    .reverse()
    .join("")
    .match(/^\s*\)(?<label>[^)$\r\n]+?)\(\s*\${2}/)
  if (eqnoMatch && eqnoMatch.groups) {
    const label = eqnoMatch.groups["label"].split("").reverse().join("")
    end = end - ((eqnoMatch.index || 0) + eqnoMatch[0].length)
    return { label, end }
  }
  return { end }
}

/** Generate inline dollar rule */
function math_block_dollar(
  options: IOptions
): (state: StateBlock, startLine: number, endLine: number, silent: boolean) => boolean {
  /** Block dollar rule */
  function math_block_dollar_rule(
    state: StateBlock,
    startLine: number,
    endLine: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    silent: boolean
  ): boolean {
    let haveEndMarker = false
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    let end = state.eMarks[startLine]

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false
    }
    if (startPos + 2 > end) {
      return false
    }
    if (
      state.src.charCodeAt(startPos) != 0x24 ||
      state.src.charCodeAt(startPos + 1) != 0x24
    ) {
      return false
    }
    // search for end of block
    let nextLine = startLine
    let label: undefined | string = undefined
    // search for end of block on same line
    let lineText = state.src.slice(startPos, end)
    if (lineText.trim().length > 3) {
      if (lineText.trim().endsWith("$$")) {
        haveEndMarker = true
        end = end - 2 - (lineText.length - lineText.trim().length)
      } else if (options.allow_labels) {
        const output = matchLabel(lineText, end)
        if (output.label !== undefined) {
          haveEndMarker = true
          label = output.label
          end = output.end
        }
      }
    }

    // search for end of block on subsequent line
    let start: number
    if (!haveEndMarker) {
      while (nextLine + 1 < endLine) {
        nextLine += 1
        start = state.bMarks[nextLine] + state.tShift[nextLine]
        end = state.eMarks[nextLine]
        if (end - start < 2) {
          continue
        }
        lineText = state.src.slice(start, end)
        if (lineText.trim().endsWith("$$")) {
          haveEndMarker = true
          end = end - 2 - (lineText.length - lineText.trim().length)
          break
        }
        if (options.allow_labels) {
          const output = matchLabel(lineText, end)
          if (output.label !== undefined) {
            haveEndMarker = true
            label = output.label
            end = output.end
            break
          }
        }
      }
    }
    if (!haveEndMarker) {
      return false
    }

    state.line = nextLine + (haveEndMarker ? 1 : 0)

    const token = state.push(label ? "math_block_label" : "math_block", "math", 0)
    token.block = true
    token.content = state.src.slice(startPos + 2, end)
    token.markup = "$$"
    token.map = [startLine, state.line]
    if (label) {
      token.info = options.labelNormalizer ? options.labelNormalizer(label) : label
    }
    return true
  }
  return math_block_dollar_rule
}
