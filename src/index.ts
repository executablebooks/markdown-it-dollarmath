/* eslint-disable @typescript-eslint/no-explicit-any */
import type MarkdownIt from "markdown-it/lib"
// import type StateBlock from "markdown-it/lib/rules_block/state_block"
import type StateInline from "markdown-it/lib/rules_inline/state_inline"

export interface IOptions {
  // Capture math blocks with label suffix, e.g. `$$a=1$$ (eq1)`
  allow_labels?: boolean
  // Parse inline math when there is space after/before the opening/closing `$`, e.g. `$ a $`
  allow_space?: boolean
  // Parse inline math when there is a digit before/after the opening/closing `$`, e.g. `1$` or `$2`
  allow_digits?: boolean
  // Search for double-dollar math within inline contexts
  double_inline?: boolean
  // The render function for math content
  renderer?: (content: string, options?: { [key: string]: any }) => string
  // options to parse to the render function, for inline math
  optionsInline?: { [key: string]: any }
  // options to parse to the render function, for block math
  optionsBlock?: { [key: string]: any }
}

const OptionDefaults: IOptions = {
  allow_labels: true,
  allow_space: true,
  allow_digits: true,
  double_inline: true
}

/**
 * A markdown-it plugin for parsing dollar delimited math,
 * e.g. inline: ``$a=1$``, block: ``$$b=2$$`
 */
export default function dollarmath_plugin(md: MarkdownIt, options?: IOptions): void {
  const fullOptions = { ...OptionDefaults, ...options }
  md.inline.ruler.before("escape", "math_inline", math_inline_dollar(fullOptions))
  // md.block.ruler.before("fence", "math_block", math_block_dollar(fullOptions))

  const renderer = options?.renderer

  if (renderer) {
    md.renderer.rules["math_inline"] = (tokens, idx) => {
      const content = tokens[idx].content
      let res: string
      try {
        res = renderer(content, options?.optionsInline)
      } catch (err) {
        res = md.utils.escapeHtml(`${content}:${err.message}`)
      }
      return res
    }
  } else {
    // basic renderer for testing
    md.renderer.rules["math_inline"] = (tokens, idx) => {
      const content = tokens[idx].content
      const tag = tokens[idx].markup === "$$" ? "eqn" : "eq"
      return `<${tag}>${content}</${tag}>`
    }
  }
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
      const token = state.push("math_inline", "math", 0)
      token.content = text
      token.markup = is_double ? "$$" : "$"
    }
    state.pos = end + 1
    return true
  }
  return math_inline_dollar_rule
}
