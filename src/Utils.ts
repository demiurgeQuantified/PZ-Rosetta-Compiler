/* eslint-disable prettier/prettier */

import { HTMLElement, Node, NodeType } from "node-html-parser";

const RESERVED_FUNCTION_NAMES = ['toString', 'valueOf'];
const RESERVED_WORDS = [
    'and',
    'break',
    'do',
    'else',
    'elseif',
    'end',
    'false',
    'for',
    'function',
    'if',
    'in',
    'local',
    'nil',
    'not',
    'or',
    'repeat',
    'return',
    'then',
    'true',
    'until',
    'while',

    // NOTE: This is a technical issue involving YAML interpreting
    //       this as a BOOLEAN not a STRING value.
    'on',
    'off',
    'yes',
    'no',
];

export const removeHtmlEncoding = (s: string): string => {
    return s
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&amp;', '&')
        .replaceAll('&nbsp;', ' ');
};

export const expandTypeNames = (
    node: Node
): string => {
    var fullText = ""

    for (const child of node.childNodes) {
        const htmlNode = <HTMLElement> child;
        if (htmlNode.tagName === "A") {
            const title = htmlNode.getAttribute("title");
            if (title === undefined) {
                throw new Error("Link in parameters has no title");
            }
            if (title.startsWith("interface in ") || title.startsWith("class in ") || title.startsWith("class or interface in ")) {
                const packageName = title.substring(title.lastIndexOf(" ") + 1);
                fullText = fullText + packageName + ".";
            }
        }
        fullText += child.textContent.replace(".", "$");
    }

    return fullText
}

export const splitParameters = (
    paramString: string,
): Array<{ name: string; type: string; typeFull: string }> => {
    if (paramString === '') return [];

    paramString = paramString
        .replace('(', '')
        .replace(')', '')
        .replaceAll('\n', '')
        .replaceAll(String.fromCharCode(160), ' ')
        .trim();

    const params: Array<{ name: string; type: string; typeFull: string }> = [];

    function process(item: { name: string; type: string; typeFull: string }) {
        let name = '';

        for (let index = item.typeFull.length - 1; index >= 0; index--) {
            if (item.typeFull[index] === ' ') break;
            name = item.typeFull[index] + name;
        }

        item.name = name;
        item.type = item.type
            .substring(0, item.type.length - name.length)
            .trim()
        item.type = item.type
            .substring(item.type.lastIndexOf(".") + 1)
            .replace("$", ".");
        item.typeFull = item.typeFull
            .substring(0, item.typeFull.length - name.length)
            .trim();
    }

    let genericIndent = 0;
    let current = { name: '', type: '', typeFull: '' };

    for (const char of paramString) {
        // (Generics counter block)
        if (char === '<') {
            genericIndent++;
            current.typeFull += char;
            continue;
        } else if (char === '>') {
            genericIndent--;
            current.typeFull += char;
            continue;
        }

        // (Only split params if not inside of a Generics block)
        if (char === ',' && genericIndent === 0) {
            process(current);
            params.push(current);
            current = { name: '', type: '', typeFull: '' };
            continue;
        }

        // (Add to basic param if not in Generics block)
        if (genericIndent === 0) current.type += char;

        current.typeFull += char;
    }

    process(current);
    params.push(current);

    // if(paramString.indexOf("<") !== -1) console.log(params);

    return params;
};

export const isReservedWord = (word: string): boolean =>
    RESERVED_WORDS.indexOf(word.toLowerCase()) !== -1;

export const isReservedFunctionName = (word: string): boolean =>
    RESERVED_FUNCTION_NAMES.indexOf(word) !== -1;
