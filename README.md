# fastmark

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/zamrdzhu/fastmark/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/zamrdzhu/fastmark/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A faster drop-in replacement for marked 18.1.3: parse(markdown) returns exactly
the HTML marked.parse returns with default options, for less CPU. One
dependency-free ES module (parse.js) plus the harness driver (main.ts).

## Correctness

- Practice set (720 cases: 680 CommonMark/GFM spec examples + 40 generated
  README documents of 20–100 KB): **720/720 byte-identical** to the reference
  outputs produced by marked 18.1.3 with default options.
- Differential fuzzing against the vendored marked build (5,034 mutated and
  token-soup inputs, plus a 428k-case differential test of the inline text
  scanner design): 0 mismatches.

## Speed (this machine, Node 24, interleaved A/B medians)

In-process render loop over the full practice set, baseline `marked.parse`
vs fastmark `parse`, median of 15 alternating rounds:

| set | baseline | fastmark | speedup |
| --- | ---: | ---: | ---: |
| 680 spec examples | 8.9 ms/pass | 7.4 ms/pass | ~1.2× |
| 40 large documents | 731 ms/pass | 483 ms/pass | ~1.5× |
| full 720 weighted | — | — | ~1.5× |

End-to-end through the harness driver (`node main.ts`, wall clock, median of
5 runs; includes Node startup and JSON I/O, identical for both): baseline
~1.43 s vs fastmark ~1.22 s, ~1.2×.

## How it works

parse.js is a fork of marked 18.1.3 (MIT — see vendor/marked/) with
semantics-preserving optimizations only; output is unchanged by construction
and verified above:

- The lexer/parser and their precompiled rule tables are built once and
  shared across parse() calls (marked constructs fresh instances per call);
  only the small per-parse state is reset.
- The emphasis-closer scan (fe) runs backwards from the end of the string
  and stops as soon as every delimiter's last closer is found, instead of
  scanning the whole input forwards; chunks with no `*`/`_`/`~` skip it
  entirely. The mask stack is a plain array instead of a WeakMap.
- Block dispatch computes the block's first significant character once and
  only runs the tokenizers that can possibly match it (code, fences,
  heading, hr, blockquote, list, html, def), plus cheap necessary-condition
  pre-checks for tables (delimiter row) and setext headings (an underline
  line before the first blank line).
- list() caches the indent-dependent begin/item regexes it used to rebuild
  for every list item, skips tab-expansion replaces on tab-free lines,
  guards its six per-line "begin" tests with a first-character check, and
  tests for a trailing double blank line by inspecting only the item's tail.
- Inline dispatch guards each tokenizer by the only first characters it can
  match (escape, tag, link, reflink, emStrong, codespan, br, del, autolink,
  and a three-branch shape check for url), so plain text positions fall
  through to the text tokenizer without paying for doomed regex attempts.
- Masking (#n) skips its code/link/html masking replaces when the chunk
  contains none of the characters those replaces can act on, and lex()
  skips the carriage-return rewrite when the input has no \r.

## Run it

```sh
MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=/output node main.ts
```
