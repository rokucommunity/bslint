import { expect } from 'chai';
import { Range } from 'vscode-languageserver-types';
import { applyEdits, compareRanges, getLineOffsets } from './textEdit';

describe('sortByRange', () => {
    it('Does not crash with invalid entries', () => {
        const aOK = { range: Range.create(0, 0, 0, 0) };
        const bOK = { range: Range.create(1, 0, 1, 0) };
        const aKO = { range: null };
        const bKO = { range: null };
        const aKO2 = { range: { } };
        const bKO2 = { range: { } };
        const aKO3 = { range: { start: {} } };
        const bKO3 = { range: { start: {} } };
        expect(compareRanges(null, null)).equals(0);
        expect(compareRanges(aOK, null)).equals(0);
        expect(compareRanges(null, bOK)).equals(0);
        expect(compareRanges(aKO, null)).equals(0);
        expect(compareRanges(null, bKO)).equals(0);
        expect(compareRanges(aKO2 as any, null)).equals(0);
        expect(compareRanges(null, bKO2 as any)).equals(0);
        expect(compareRanges(aKO3 as any, null)).equals(0);
        expect(compareRanges(null, bKO3 as any)).equals(0);
    });

    it('Same range returns 0', () => {
        const a = { range: Range.create(0, 0, 0, 0) };
        expect(compareRanges(a, a)).equals(0);
    });

    it('Sort by lines', () => {
        const a = { range: Range.create(0, 0, 0, 0) };
        const b = { range: Range.create(1, 0, 1, 0) };
        expect(compareRanges(a, b)).equals(-1);
        expect(compareRanges(b, a)).equals(1);
    });

    it('Sort by column', () => {
        const a = { range: Range.create(0, 0, 0, 0) };
        const b = { range: Range.create(0, 1, 0, 1) };
        expect(compareRanges(a, b)).equals(-1);
        expect(compareRanges(b, a)).equals(1);
    });
});

describe('getLineOffsets', () => {
    it('Handle empty source', () => {
        expect(getLineOffsets(null)).deep.equals([]);
        expect(getLineOffsets('')).deep.equals([]);
    });

    it('Finds simple offsets', () => {
        expect(getLineOffsets('a\nb\nc')).deep.equals([0, 2, 4]);
        expect(getLineOffsets('a\r\nb\r\nc')).deep.equals([0, 3, 6]);
    });

    it('Handles final linebreak', () => {
        expect(getLineOffsets('a\nb\nc\n')).deep.equals([0, 2, 4, 6]);
        expect(getLineOffsets('a\r\nb\r\nc\r\n')).deep.equals([0, 3, 6, 9]);
    });

    it('Handles initial linebreak', () => {
        expect(getLineOffsets('\na\nb\nc')).deep.equals([0, 1, 3, 5]);
        expect(getLineOffsets('\r\na\r\nb\r\nc')).deep.equals([0, 2, 5, 8]);
    });

    it('Handles inconsistent linebreaks', () => {
        expect(getLineOffsets('a\nb\r\nc')).deep.equals([0, 2, 5]);
        expect(getLineOffsets('a\r\nb\nc')).deep.equals([0, 3, 5]);
    });
});

describe('applyEdits', () => {
    it('Edits in the right order', () => {
        const newSrc = applyEdits(
            'line 1\nline 2', [{
                range: Range.create(0, 0, 0, 6),
                text: 'replaced line 1!'
            }, {
                range: Range.create(1, 5, 1, 6),
                text: '(2)'
            }]
        );
        expect(newSrc).equals('replaced line 1!\nline (2)');
    });

    it('Edits in the reverse order', () => {
        const newSrc = applyEdits(
            'line 1\nline 2', [{
                range: Range.create(1, 5, 1, 6),
                text: '(2)'
            }, {
                range: Range.create(0, 0, 0, 6),
                text: 'replaced line 1!'
            }]
        );
        expect(newSrc).equals('replaced line 1!\nline (2)');
    });
});
