import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs-extra';
import { BscFile, BsDiagnostic, BsDiagnosticInput, DiagnosticLocationInput, Location, ProvideCodeActionsEvent, Position, Range, util } from 'brighterscript';
import { CodeActionKind, codeActionUtil } from 'brighterscript/dist/CodeActionUtil';

interface LintCodeAction {
    type: 'replace';
    filePath: string;
    range: Range;
    newText: string;
}

export interface TextEdit {
    range: Range;
    text: string;
}

export interface ChangeEntry {
    diagnostic: BsDiagnostic | BsDiagnosticInput;
    changes: TextEdit[];
}

/**
 * Get the line/character `Location` of a diagnostic location, which is either a `Locatable` (such as a token or node)
 * or an already-resolved `Location` (i.e. diagnostics coming back from the program)
 */
export function getDiagnosticLocation(location: DiagnosticLocationInput): Location | undefined {
    if (location && 'startPosition' in location) {
        return util.getLocation(location);
    }
    return location as Location;
}

export function replaceText(range: Range, text: string) {
    return {
        type: 'replace',
        range,
        text
    };
}

export function insertText(pos: Position, text: string) {
    return {
        type: 'insert',
        range: Range.create(pos, pos),
        text
    };
}

export function compareRanges(a: { range: Range }, b: { range: Range }): number {
    if (!a || !b || !a.range || !b.range) {
        return 0;
    }
    const result = comparePos(a.range.start, b.range.start);
    return result === 0 ? comparePos(a.range.end, b.range.end) : result;
}

export function comparePos(a: Position, b: Position) {
    if (!a || !b || isNaN(a.line) || isNaN(b.line)) {
        return 0;
    }
    if (a.line < b.line) {
        return -1;
    }
    if (a.line > b.line) {
        return 1;
    }
    if (isNaN(a.character) || isNaN(b.character)) {
        return 0;
    }
    if (a.character < b.character) {
        return -1;
    }
    if (a.character > b.character) {
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

export async function applyFixes(fix: boolean, pendingFixes: Map<string, TextEdit[]>) {
    if (!fix || !pendingFixes || pendingFixes.size === 0) {
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

export function addFixesToEvent(event: ProvideCodeActionsEvent) {
    return (file: BscFile, entry: ChangeEntry) => {
        const changes: LintCodeAction[] = entry.changes.map(change => ({
            type: 'replace',
            filePath: file.srcPath,
            range: change.range,
            newText: change.text
        }));
        const action = {
            title: entry.diagnostic.message,
            // code actions are only built for diagnostics coming back from the program, which have resolved locations
            diagnostics: [entry.diagnostic as BsDiagnostic],
            kind: CodeActionKind.QuickFix,
            isPreferred: true,
            changes
        };
        event.codeActions.push(codeActionUtil.createCodeAction(action));
    };
}

export function addFixAllToEvent(event: ProvideCodeActionsEvent, entries: ChangeEntry[]) {
    const changes: LintCodeAction[] = entries.flatMap(entry => entry.changes.map(change => ({
        type: 'replace',
        filePath: getDiagnosticLocation(entry.diagnostic.location)?.uri,
        range: change.range,
        newText: change.text
    })));
    event.codeActions.push(
        codeActionUtil.createCodeAction({
            title: `Fix all: ${entries[0].diagnostic.message}`,
            kind: CodeActionKind.QuickFix,
            changes
        })
    );
}
