import { describe, it, expect } from 'vitest';
import { maskName } from '../src/utils/maskSensitiveData';

describe('maskName', () => {
  it('should mask multi-word names correctly', () => {
    expect(maskName('John Alexander Doe')).toBe('j*** d');
    expect(maskName('Nikhil Doe')).toBe('n*** d');
  });

  it('should mask single-word names correctly', () => {
    expect(maskName('Johnathan')).toBe('j***n');
    expect(maskName('Nikhil')).toBe('n***l');
  });

  it('should handle small single-word names as Anonymous', () => {
    expect(maskName('Jo')).toBe('Anonymous');
    expect(maskName('J')).toBe('Anonymous');
  });

  it('should handle international characters correctly', () => {
    // 𝔍𝔬𝔥𝔫 (Mathematical Fraktur capital J)
    // 𝔍 is already lowercase-less in some contexts or stays as is
    // We just want to ensure it doesn't crash and handles the surrogate pairs
    const masked = maskName('𝔍𝔬𝔥𝔫');
    expect(masked).toContain('***');
    expect([...masked][0]).toBe([...('𝔍'.toLowerCase())][0]);
  });

  it('should handle edge cases', () => {
    expect(maskName('')).toBe('Anonymous');
    expect(maskName('   ')).toBe('Anonymous');
    expect(maskName(null)).toBe('Anonymous');
    expect(maskName(undefined)).toBe('Anonymous');
    expect(maskName(123)).toBe('Anonymous');
  });
});
