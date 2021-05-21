import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs-extra';
import { Range } from 'brighterscript/dist/astUtils';

export interface TextEdit {
    range: Range;
    text: string;
}

export function replaceText(range: Range, text: string) {
    return {
        range,
        text
    };
}

export function compareRanges(a: { range: Range }, b: { range: Range }): number {
    if (!a || !b || !a.range || !b.range) {
        return 0;
    }
    const sa = a.range.start;
    const sb = b.range.start;
    if (isNaN(sa.line) || isNaN(sb.line)) {
        return 0;
    }
    if (sa.line < sb.line) {
        return -1;
    }
    if (sa.line > sb.line) {
        return 1;
    }
    if (isNaN(sa.character) || isNaN(sb.character)) {
        return 0;
    }
    if (sa.character < sb.character) {
        return -1;
    }
    if (sa.character > sb.character) {
        return 1;
    }
    return 0;
}

export function getLineOffsets(src: string) {
    if (!src) {
        return [];
    }
    const offsets: number[] = [];
    const reNL = /(\r\n|\n)/g;
    let m = reNL.exec(src);
    let index = 0;
    while (m) {
        offsets.push(index);
        index = m.index + m[0].length;
        m = reNL.exec(src);
    }
    offsets.push(index);
    return offsets;
}

export function rangeToOffset(lineOffsets: number[], range: Range) {
    const { start, end } = range;
    if (isNaN(lineOffsets[start.line]) || isNaN(lineOffsets[end.line])) {
        return null;
    }
    return {
        start: lineOffsets[start.line] + start.character,
        end: lineOffsets[end.line] + end.character
    };
}

export function applyEdits(src: string, changes: TextEdit[]) {
    const lineOffsets = getLineOffsets(src);
    const edits = [...changes].sort(compareRanges).reverse();
    let newSrc = src;
    edits.forEach(edit => {
        const offsets = rangeToOffset(lineOffsets, edit.range);
        if (offsets) {
            newSrc = newSrc.substr(0, offsets.start) + edit.text + newSrc.substr(offsets.end);
        }
    });
    return newSrc;
}

export async function applyFixes(pendingFixes: Map<string, TextEdit[]>) {
    if (!pendingFixes || pendingFixes.size === 0) {
        return;
    }
    for (const file of pendingFixes.keys()) {
        const changes = pendingFixes.get(file);
        if (changes?.length && existsSync(file)) {
            const src = (await readFile(file)).toString();
            const newSrc = applyEdits(src, changes);
            if (newSrc !== src) {
                await writeFile(file, newSrc);
            }
        }
        pendingFixes.delete(file);
    }
}