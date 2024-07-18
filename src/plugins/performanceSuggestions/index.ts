import { BscFile, BsDiagnostic, isXmlFile, XmlFile, DiagnosticSeverity } from "brighterscript";
import { messages } from "./diagnosticMessages";
import { PluginContext } from "../../util";

const xmlNotRecommendedFieldType = ["array", "assocarray"];

export default class CodePerformance {
    name: "codePerformance";

    constructor(private lintContext: PluginContext) { }

    afterFileValidate(file: BscFile) {
        if (this.lintContext.ignores(file)) {
            return;
        }

        const diagnostics: Omit<BsDiagnostic, "file">[] = [];
        if (isXmlFile(file)) {
            diagnostics.push(...this.validateXMLFile(file));
        }

        const bsDiagnostics: BsDiagnostic[] = diagnostics.map((diagnostic) => ({
            ...diagnostic,
            file,
        }));

        // append diagnostics
        file.addDiagnostics(bsDiagnostics);
    }

    validateXMLFile(file: XmlFile) {
        const diagnostics: Omit<BsDiagnostic, "file">[] = [];
        const apiFields = file.parser.ast?.component?.api?.fields;
        const { interfaceType } = this.lintContext.severity;

        const validateInterfaceType = interfaceType !== DiagnosticSeverity.Hint;

        if (apiFields && validateInterfaceType) {
            for (const field of apiFields) {
                const { tag, attributes, range } = field;
                if (tag.text === "field") {
                    const notRecommendedAttrVal = attributes.find(
                        ({ key, value }) =>
                            key.text === "type" &&
                            xmlNotRecommendedFieldType.includes(value.text)
                    );
                    if (notRecommendedAttrVal) {
                        diagnostics.push(
                            messages.xmlNotRecommendedFieldType(
                                notRecommendedAttrVal.value.text,
                                range,
                                interfaceType
                            )
                        );
                    }
                }
            }
        }

        return diagnostics;
    }

}
