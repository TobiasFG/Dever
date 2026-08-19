import { describe, expect, it } from 'vitest';
import { kindIcon, kindLabel, scriptDir } from './derive';

describe('scripts derive', () => {
  it('kindLabel names each interpreter family', () => {
    expect(kindLabel('powerShell')).toBe('PowerShell');
    expect(kindLabel('shell')).toBe('Shell');
    expect(kindLabel('batch')).toBe('Batch');
    expect(kindLabel('python')).toBe('Python');
    expect(kindLabel('node')).toBe('Node');
  });

  it('kindIcon maps shell-like kinds to the terminal icon', () => {
    expect(kindIcon('powerShell')).toBe('terminal');
    expect(kindIcon('shell')).toBe('terminal');
    expect(kindIcon('batch')).toBe('terminal');
    expect(kindIcon('python')).toBe('file');
    expect(kindIcon('node')).toBe('file');
  });

  it('scriptDir returns the parent directory for both slash styles', () => {
    expect(scriptDir('/code/app/scripts/build.sh')).toBe('/code/app/scripts');
    expect(scriptDir('C:\\src\\tools\\deploy.ps1')).toBe('C:\\src\\tools');
  });
});
