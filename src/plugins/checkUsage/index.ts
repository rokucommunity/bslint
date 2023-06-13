import { AfterFileValidateEvent, AfterProgramValidateEvent, AfterScopeValidateEvent, BscFile, CompilerPlugin, createVisitor, DiagnosticSeverity, isBrsFile, isXmlFile, Range, TokenKind, WalkMode, XmlFile } from 'brighterscript';
import { SGNode } from 'brighterscript/dist/parser/SGTypes';
import { PluginContext } from '../../util';

const isWin = process.platform === 'win32';

export enum UnusedCode {
    UnusedComponent = 'LINT4001',
    UnusedScript = 'LINT4002'
}

export default class CheckUsage implements CompilerPlugin {

    name = 'checkUsage';

    private vertices: Vertice[] = [];
    private map = new Map<string, Vertice>();
    private parsed = new Set<string>();
    private walked: Set<string>;
    private main: Vertice;

    constructor(_: PluginContext) {
        // known SG components
        const walked = new Set<string>();
        [
            'animation', 'busyspinner', 'buttongroup', 'channelstore', 'checklist', 'colorfieldinterpolator',
            'contentnode', 'dialog', 'dynamiccustomkeyboard', 'dynamickeyboard', 'dynamickeygrid',
            'dynamicminikeyboard', 'dynamicpinpad', 'floatfieldinterpolator', 'font', 'group', 'keyboard',
            'keyboarddialog', 'label', 'labellist', 'layoutgroup', 'markupgrid', 'markuplist', 'maskgroup',
            'minikeyboard', 'node', 'parallelanimation', 'pindialog', 'pinpad', 'poster', 'progressdialog',
            'radiobuttonlist', 'rectangle', 'rowlist', 'scene', 'scrollabletext', 'scrollinglabel',
            'sequentialanimation', 'simplelabel', 'standarddialog', 'standardkeyboarddialog',
            'standardmessagedialog', 'standardpinpaddialog', 'standardprogressdialog', 'targetgroup',
            'targetlist', 'targetset', 'task', 'texteditbox', 'timegrid', 'timer', 'vector2dfieldinterpolator',
            'video', 'voicetexteditbox', 'zoomrowlist'
        ].forEach(name => walked.add(`"${name}"`)); // components are pre-quoted
        this.walked = walked;
    }

    private walkChildren(v: Vertice, children: SGNode[], file: BscFile) {
        children.forEach(node => {
            const name = node.tagName;
            if (name) {
                v.edges.push(createComponentEdge(name, node.tokens.startTagName.range, file));
            }
            const itemComponentName = node.getAttribute('itemcomponentname');
            if (itemComponentName) {
                v.edges.push(createComponentEdge(itemComponentName.value, itemComponentName.range, file));
            }
            if (node.elements) {
                this.walkChildren(v, node.elements, file);
            }
        });
    }

    private walkGraph(edge: Edge) {
        const { name } = edge;
        if (this.walked.has(name)) {
            return;
        }
        this.walked.add(name);
        const v = this.map.get(name);
        if (!v) {
            console.log('[Check Usage] Unknown component:', name);
            return;
        }
        v.edges.forEach(target => {
            this.walkGraph(target);
        });
    }

    afterFileValidate(event: AfterFileValidateEvent) {
        const { file } = event;
        // collect all XML components
        if (isXmlFile(file)) {
            if (!file.componentName) {
                return;
            }
            const { text, range } = file.componentName;
            if (!text) {
                return;
            }
            const edge = createComponentEdge(text, range, file);

            let v: Vertice;
            if (this.map.has(edge.name)) {
                v = this.map.get(edge.name);
                v.file = file;
            } else {
                v = {
                    name: edge.name,
                    file,
                    edges: []
                };
                this.vertices.push(v);
                this.map.set(edge.name, v);
            }

            if (file.parentComponentName) {
                const { text, range } = file.parentComponentName;
                v.edges.push(createComponentEdge(text, range, file));
            }

            const children = file.ast.componentElement?.childrenElement;
            if (children) {
                this.walkChildren(v, children.elements, file);
            }
        }
    }

    afterScopeValidate(event: AfterScopeValidateEvent) {
        const { scope } = event;
        const files = scope.getAllFiles();
        const pkgPath = scope.name.toLowerCase();
        let v: Vertice;
        if (scope.name === 'global') {
            return;
        } else if (scope.name === 'source') {
            v = {
                name: 'source',
                file: null,
                edges: []
            };
        } else {
            const comp = files.find(file => file.pkgPath.toLowerCase() === pkgPath) as XmlFile;
            if (!comp) {
                console.log('[Check Usage] Scope XML component not found:', scope.name);
                return;
            }
            const name = comp.componentName?.text;
            v = name && this.map.get(`"${name.toLowerCase()}"`);
            if (!v) {
                console.log('[Check Usage] Component not found:', scope.name);
                return;
            }
        }
        scope.getOwnFiles().forEach(file => {
            if (!isBrsFile(file)) {
                return;
            }
            const pkgPath = normalizePath(file.pkgPath);
            v.edges.push({
                name: pkgPath,
                range: null,
                file
            });
            if (this.parsed.has(pkgPath)) {
                return;
            }
            this.parsed.add(pkgPath);
            const fv: Vertice = {
                name: pkgPath,
                file,
                edges: []
            };
            this.vertices.push(fv);
            const map = this.map;
            this.map.set(pkgPath, fv);
            if (pkgPath === 'source/main.brs' || pkgPath === 'source/main.bs') {
                this.main = fv;
            }
            // find strings that look like referring to component names
            file.parser.references.functionExpressions.forEach(fun => {
                fun.body.walk(createVisitor({
                    LiteralExpression: (e) => {
                        const { kind } = e.token;
                        if (kind === TokenKind.StringLiteral) {
                            const { text } = e.token;
                            if (text !== '""') {
                                const name = text.toLowerCase();
                                if (map.has(name)) {
                                    fv.edges.push({
                                        name,
                                        range: e.token.range,
                                        file
                                    });
                                }
                            }
                        }
                    }
                }), { walkMode: WalkMode.visitExpressions });
            });
        });
    }

    afterProgramValidate(_: AfterProgramValidateEvent) {
        if (!this.main) {
            throw new Error('No `main.brs`');
        }
        this.walkGraph({ name: this.main.name });
        this.vertices.forEach(v => {
            if (!this.walked.has(v.name) && v.file) {
                if (isBrsFile(v.file)) {
                    v.file.addDiagnostics([{
                        severity: DiagnosticSeverity.Warning,
                        code: UnusedCode.UnusedScript,
                        message: `Script '${v.file.pkgPath}' does not seem to be used`,
                        range: Range.create(0, 0, 1, 0),
                        file: v.file
                    }]);
                } else if (v.file.componentName?.range) {
                    v.file.addDiagnostics([{
                        severity: DiagnosticSeverity.Warning,
                        code: UnusedCode.UnusedComponent,
                        message: `Component '${v.file.pkgPath}' does not seem to be used`,
                        range: v.file.componentName.range,
                        file: v.file
                    }]);
                }
            }
        });
    }
}

function normalizePath(s: string) {
    let p = s.toLowerCase();
    if (isWin) {
        p = p.replace('\\', '/');
    }
    return p;
}

function createComponentEdge(name: string, range: Range = null, file: BscFile = null) {
    return {
        name: `"${name.toLowerCase()}"`,
        range,
        file
    };
}

interface Vertice {
    name: string;
    file: BscFile;
    edges: Edge[];
    used?: boolean;
}

interface Edge {
    name: string;
    file?: BscFile;
    range?: Range;
}
