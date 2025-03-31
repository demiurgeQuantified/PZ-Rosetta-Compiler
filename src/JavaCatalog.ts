/* eslint-disable prettier/prettier */

import * as fs from 'fs';
import { parse } from 'node-html-parser';
import { JavaClass } from './JavaClass';
import { JavaPackage } from './JavaPackage';

export class JavaCatalog {
    readonly packages: { [name: string]: JavaPackage } = {};

    parse(path: string) {
        const html = fs.readFileSync(path).toString();
        const root = parse(html);

        const classList = [];
        const list = root.getElementsByTagName('a');
        for (const item of list) {
            const href = item.attributes['href'];
            if (!href.startsWith('zombie/')) continue;
            classList.push(href);
        }

        const failedFiles = [];
        for (const classURI of classList) {
            const uri = `./docs/${classURI}`;
            try {
                const clazz = new JavaClass(uri);
                const name = clazz.package;
                if (!this.packages[name]) {
                    this.packages[name] = new JavaPackage(name);
                }
                this.packages[name].addClass(clazz);
                for (var nestedClass of clazz.nestedClasses) {
                    nestedClass = name.replaceAll(".", "/") + "/" + nestedClass + ".html"
                    if (!classList.includes(nestedClass)) {
                        classList.push(nestedClass)
                    }
                }
            } catch (ex) {
                console.error(`### Failed to scrape file: ${uri}`);
                failedFiles.push(uri);
            }
        }
        if (failedFiles.length !== 0) {
            console.error('Failed classes: ');
            for (const entry of failedFiles) {
                console.error(entry);
            }
        }
    }

    save(format: 'yml' | 'json') {
        const keys = Object.keys(this.packages);
        keys.sort((a, b) => a.localeCompare(b));
        for (const key of keys) {
            this.packages[key].save(format);
        }
    }
}
