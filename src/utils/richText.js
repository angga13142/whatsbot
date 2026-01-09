// File: src/utils/richText.js

/**
 * Rich Text Utility
 *
 * Purpose: Generate beautiful formatted text for WhatsApp messages
 * using emojis, bolding, and box-drawing characters.
 *
 * @module utils/richText
 */

module.exports = {
  bold(text) {
    return `*${text}*`;
  },
  italic(text) {
    return `_${text}_`;
  },
  monospace(text) {
    return `\`\`\`${text}\`\`\``;
  },
  strike(text) {
    return `~${text}~`;
  },

  /**
   * Create a bordered box with a title
   */
  createBox(title, content, width = 35) {
    // Unicode box drawing
    const TLS = '╔'; // Top Left Single
    const TRS = '╗';
    const BLS = '╚';
    const BRS = '╝';
    const H = '═'; // Horizontal
    const V = '║'; // Vertical

    // Build Header
    let box = '';
    box += TLS + H.repeat(width) + TRS + '\n';

    // Center Title
    const titlePadding = Math.max(0, width - title.length);
    const leftPad = Math.floor(titlePadding / 2);
    const rightPad = titlePadding - leftPad;

    box += V + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + V + '\n';
    box += BLS + H.repeat(width) + BRS + '\n';

    if (content) {
      box += '\n' + content;
    }

    return box;
  },

  /**
   * Create a simple data table (key: value)
   */
  createKeyValueTable(data) {
    let output = '';
    const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));

    for (const [key, value] of Object.entries(data)) {
      // Simple padding
      output += `${key.padEnd(maxKeyLength)} : ${value}\n`;
    }
    return output;
  },

  createDivider(char = '─', length = 30) {
    return char.repeat(length);
  },

  formatList(items, numbered = false) {
    return items
      .map((item, i) => {
        const prefix = numbered ? `${i + 1}.` : '•';
        return `${prefix} ${item}`;
      })
      .join('\n');
  },
};
