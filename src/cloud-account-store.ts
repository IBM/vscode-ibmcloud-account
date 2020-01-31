/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';

const ACCOUNT_KEY = 'ibmcloud-account-guid';
const EMAIL_KEY = 'ibmcloud-account-email';
const SERVICE = 'VS Code IBM Cloud Account';
const REFRESH_TOKEN_ACCOUNT = 'Refresh Token';

/**
 * A class for storing authentication information for IBM Cloud.
 */
export class CloudAccountStore {

    private keytar: any;

    /**
     * Constructor.
     * @param globalState The global state to use.
     */
    constructor(private globalState: vscode.Memento) {
        const keytarPaths = [
            `${vscode.env.appRoot}/node_modules.asar/keytar`,
            `${vscode.env.appRoot}/node_modules/keytar`,
        ];
        for (const keytarPath of keytarPaths) {
            try {
                this.keytar = require(keytarPath);
                return;
            } catch {
                // Ignore the error and try the next path.
            }
        }
        throw new Error(`Failed to load keytar module`);
    }

    /**
     * Get the persisted account.
     */
    public async getAccount(): Promise<string | undefined> {
        return this.globalState.get(ACCOUNT_KEY, undefined);
    }

    /**
     * Set the persisted account.
     * @param account The account.
     */
    public async setAccount(account: string) {
        await this.globalState.update(ACCOUNT_KEY, account);
    }

    /**
     * Delete the persisted account.
     * @param account The account.
     */
    public async deleteAccount() {
        await this.globalState.update(ACCOUNT_KEY, undefined);
    }

    /**
     * Get the persisted email.
     */
    public async getEmail(): Promise<string | undefined> {
        return this.globalState.get(EMAIL_KEY, undefined);
    }

    /**
     * Set the persisted email.
     * @param account The email.
     */
    public async setEmail(email: string) {
        await this.globalState.update(EMAIL_KEY, email);
    }

    /**
     * Delete the persisted email.
     * @param account The email.
     */
    public async deleteEmail() {
        await this.globalState.update(EMAIL_KEY, undefined);
    }

    /**
     * Get the persisted refresh token.
     */
    public async getRefreshToken(): Promise<string> {
        return this.keytar.getPassword(SERVICE, REFRESH_TOKEN_ACCOUNT);
    }

    /**
     * Set the persisted refresh token.
     * @param refreshToken The refresh token.
     */
    public async setRefreshToken(refreshToken: string) {
        await this.keytar.setPassword(SERVICE, REFRESH_TOKEN_ACCOUNT, refreshToken);
    }

    /**
     * Delete the persisted refresh token.
     */
    public async deleteRefreshToken() {
        await this.keytar.deletePassword(SERVICE, REFRESH_TOKEN_ACCOUNT);
    }

}