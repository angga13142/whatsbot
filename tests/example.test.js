describe('Example Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const asyncOperation = () => Promise.resolve(true);
    const result = await asyncOperation();
    expect(result).toBe(true);
  });
});
