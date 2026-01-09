/**
 * Rich Text Utilities
 *
 * Create beautiful WhatsApp messages with Unicode characters
 */

module.exports = {
  /**
   * Create a box with border
   * @param {string} title - Box title
   * @param {string} content - Box content
   * @param {number} width - Box width (default: 50)
   * @returns {string} Formatted box
   */
  createBox(title, content, width = 35) {
    const chars = {
      tl: '┏',
      tr: '┓',
      bl: '┗',
      br: '┛',
      h: '━',
      v: '┃',
    };

    // Cap width minimum
    const actualWidth = Math.max(width, title.length + 4);

    const topBorder = chars.tl + chars.h.repeat(actualWidth) + chars.tr;
    const bottomBorder = chars.bl + chars.h.repeat(actualWidth) + chars.br;

    // Center Title
    const titlePadding = actualWidth - title.length - 2; // -2 for spaces
    const padL = Math.floor(titlePadding / 2);
    const padR = titlePadding - padL;

    const titleRow = chars.v + ' '.repeat(padL + 1) + title + ' '.repeat(padR + 1) + chars.v;

    return `${topBorder}\n${titleRow}\n${bottomBorder}\n\n${content}`;
  },

  /**
   * Create an ASCII table
   * @param {Array<string>} headers - Table headers
   * @param {Array<Array>} rows - Table rows
   * @returns {string} Formatted table
   */
  createTable(headers, rows) {
    if (!headers || !headers.length) return '';

    // Calculate max width for each column
    const colWidths = headers.map((h, i) => {
      const maxInCol = rows.reduce((max, row) => Math.max(max, String(row[i] || '').length), 0);
      return Math.max(h.length, maxInCol);
    });

    const chars = {
      tl: '┌',
      tm: '┬',
      tr: '┐',
      ml: '├',
      mm: '┼',
      mr: '┤',
      bl: '└',
      bm: '┴',
      br: '┘',
      h: '─',
      v: '│',
    };

    const buildRow = (items) => {
      return (
        chars.v +
        items.map((item, i) => ` ${String(item).padEnd(colWidths[i])} `).join(chars.v) +
        chars.v
      );
    };

    const buildSeparator = (left, mid, right) => {
      return left + colWidths.map((w) => chars.h.repeat(w + 2)).join(mid) + right;
    };

    const topBorder = buildSeparator(chars.tl, chars.tm, chars.tr);
    const midBorder = buildSeparator(chars.ml, chars.mm, chars.mr);
    const bottomBorder = buildSeparator(chars.bl, chars.bm, chars.br);

    let output = [topBorder, buildRow(headers), midBorder];

    rows.forEach((row) => {
      output.push(buildRow(row));
    });

    output.push(bottomBorder);

    return output.join('\n');
  },

  /**
   * Format text as WhatsApp bold
   * @param {string} text - Text to format
   * @returns {string} Formatted text
   */
  bold(text) {
    return `*${text}*`;
  },

  /**
   * Format text as WhatsApp italic
   * @param {string} text - Text to format
   * @returns {string} Formatted text
   */
  italic(text) {
    return `_${text}_`;
  },

  /**
   * Format text as WhatsApp monospace
   * @param {string} text - Text to format
   * @returns {string} Formatted text
   */
  monospace(text) {
    return `\`\`\`${text}\`\`\``;
  },

  /**
   * Add emoji to text
   * @param {string} text - Text
   * @param {string} emoji - Emoji
   * @returns {string} Text with emoji
   */
  addEmoji(text, emoji) {
    return `${emoji} ${text}`;
  },

  /**
   * Create a divider line
   * @param {string} char - Character to use (default: '━')
   * @param {number} length - Line length (default: 50)
   * @returns {string} Divider line
   */
  createDivider(char = '━', length = 35) {
    return char.repeat(length);
  },

  /**
   * Create a formatted list
   * @param {Array<string>} items - List items
   * @param {boolean} numbered - Use numbers (default: false)
   * @returns {string} Formatted list
   */
  formatList(items, numbered = false) {
    return items
      .map((item, i) => {
        return numbered ? `${i + 1}. ${item}` : `• ${item}`;
      })
      .join('\n');
  },

  /**
   * Create ASCII progress bar
   * @param {number} percentage - Percentage (0-100)
   * @param {number} width - Bar width (default: 20)
   * @returns {string} Progress bar
   */
  createProgressBar(percentage, width = 15) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percentage)}%`;
  },

  /**
   * Create a button-like text
   * @param {string} text - Button text
   * @returns {string} Formatted button
   */
  createButton(text) {
    const width = text.length + 4;
    return `┌${'─'.repeat(width)}┐\n│  ${text}  │\n└${'─'.repeat(width)}┘`;
  },
};
