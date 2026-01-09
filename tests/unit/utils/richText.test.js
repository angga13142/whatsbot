/**
 * Rich Text Unit Tests
 */

const {
  createBox,
  createDivider,
  createTable,
  formatList,
  bold,
  italic,
  monospace,
  addEmoji,
  createProgressBar,
  createButton,
} = require('../../../src/utils/richText');

describe('Rich Text Utils', () => {
  describe('createBox', () => {
    test('creates box with title and content', () => {
      const result = createBox('Title', 'Content');
      expect(result).toContain('Title');
      expect(result).toContain('Content');
      expect(result).toContain('┏');
      expect(result).toContain('┛');
    });
  });

  describe('createDivider', () => {
    test('creates divider', () => {
      expect(createDivider()).toEqual('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  });

  describe('createTable', () => {
    test('creates table from data', () => {
      const headers = ['Name', 'Role'];
      const data = [
        ['Alice', 'Admin'],
        ['Bob', 'User'],
      ];
      const result = createTable(headers, data);
      expect(result).toContain('Name');
      expect(result).toContain('Admin');
      expect(result).toContain('┌');
      expect(result).toContain('┘');
    });

    test('handles empty data', () => {
      expect(createTable([], [])).toBe('');
    });
  });

  describe('Formatting', () => {
    test('bold', () => {
      expect(bold('text')).toBe('*text*');
    });
    test('italic', () => {
      expect(italic('text')).toBe('_text_');
    });
    test('monospace', () => {
      expect(monospace('text')).toBe('```text```');
    });
    test('addEmoji', () => {
      expect(addEmoji('text', '😀')).toBe('😀 text');
    });
  });

  describe('formatList', () => {
    test('formats bullet list', () => {
      const items = ['Item 1', 'Item 2'];
      const result = formatList(items);
      expect(result).toContain('• Item 1');
      expect(result).toContain('• Item 2');
    });

    test('formats numbered list', () => {
      const items = ['Item 1', 'Item 2'];
      const result = formatList(items, true);
      expect(result).toContain('1. Item 1');
      expect(result).toContain('2. Item 2');
    });
  });

  describe('createProgressBar', () => {
    test('creates progress bar', () => {
      const result = createProgressBar(50);
      expect(result).toContain('50%');
      expect(result).toContain('█');
      expect(result).toContain('░');
    });
  });

  describe('createButton', () => {
    test('creates button', () => {
      const result = createButton('Click Me');
      expect(result).toContain('Click Me');
      expect(result).toContain('┌');
      expect(result).toContain('┘');
    });
  });
});
