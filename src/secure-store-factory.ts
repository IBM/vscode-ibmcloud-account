/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import { SecureStore } from './secure-store';
import { KeytarSecureStore } from './keytar-secure-store';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileSystemSecureStore } from './file-system-secure-store';

const homeDir = require('home-dir');

export class SecureStoreFactory {

    static async getSecureStore(): Promise<SecureStore> {
        const keytar: any = this.getKeytar();
        if (keytar) {
            return new KeytarSecureStore(keytar);
        }
        let storeDirectory: string = homeDir();
        const CHE_PROJECTS_ROOT = process.env.CHE_PROJECTS_ROOT;
        if (CHE_PROJECTS_ROOT) {
            storeDirectory = CHE_PROJECTS_ROOT;
        }
        const storePath: string = path.join(storeDirectory, '.vscode-ibmcloud-account.store');
        return new FileSystemSecureStore(storePath);
    }

    private static getKeytar(): any {
        const keytarPaths = [
            `${vscode.env.appRoot}/node_modules.asar/keytar`,
            `${vscode.env.appRoot}/node_modules/keytar`,
        ];
        for (const keytarPath of keytarPaths) {
            try {
                const keytar = require(keytarPath);
                return keytar;
            } catch {
                // Ignore the error and try the next path.
            }
        }
        return null;
    }

}
