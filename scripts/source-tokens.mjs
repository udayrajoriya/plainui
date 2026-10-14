/** A small lexer for import and forbidden-execution checks; not a TypeScript parser. */
export function sourceTokens(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }
    if (char === '/' && next === '/') {
      index = source.indexOf('\n', index + 2);
      if (index < 0) break;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) throw new Error('Unterminated block comment');
      index = end + 2;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      const quote = char;
      let value = '';
      index += 1;
      let closed = false;
      while (index < source.length) {
        const current = source[index];
        if (current === '\\') {
          value += source.slice(index, index + 2);
          index += 2;
        } else if (current === quote) {
          index += 1;
          closed = true;
          break;
        } else {
          value += current;
          index += 1;
        }
      }
      if (!closed) throw new Error('Unterminated string or template');
      tokens.push({ kind: quote === '`' ? 'template' : 'string', value });
      continue;
    }
    if (/[A-Za-z_$]/u.test(char)) {
      const start = index;
      index += 1;
      while (index < source.length && /[A-Za-z0-9_$]/u.test(source[index])) index += 1;
      tokens.push({ kind: 'identifier', value: source.slice(start, index) });
      continue;
    }
    tokens.push({ kind: 'punctuation', value: char });
    index += 1;
  }
  return tokens;
}
