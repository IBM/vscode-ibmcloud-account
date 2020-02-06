/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as rp from 'request-promise-native';
import { URL } from 'url';
import { CloudAccountStore } from './cloud-account-store';
import { EventEmitter } from 'events';

const ACCOUNT_MANAGEMENT_URL = new URL('https://accountmanagement.ng.bluemix.net');
const IAM_URL = new URL('https://iam.cloud.ibm.com');

/**
 * A class for handling authentication to IBM Cloud.
 */
export class CloudAccount extends EventEmitter {

    private accessToken?: string = undefined;
    private expiration: number = 0;

    /**
     * Constructor.
     * @param store The store to use.
     */
    constructor(private store: CloudAccountStore) {
        super();
        setInterval(async () => {
            try {
                const loggedIn = await this.loggedIn();
                if (loggedIn) {
                    await this.checkTokens();
                }
            } catch {

            }
        }, 60 * 1000);
    }

    /**
     * Log in to IBM Cloud using a username and password.
     * @param username The username.
     * @param password The password.
     */
    public async loginWithUsernameAndPassword(username: string, password: string) {
        try {
            await this.loginCommon({
                grant_type: 'password',
                username,
                password
            });
            return true;
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Log in to IBM Cloud using an API key.
     * @param apikey The API key.
     */
    public async loginWithApiKey(apikey: string) {
        try {
            await this.loginCommon({
                grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
                apikey
            });
            return true;
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Log in to IBM Cloud using Single Sign On (SSO).
     * @param cb A callback that handles requesting a passcode from IBM Cloud. The
     * callback is passed a URL to open in a web browser. The callback must return
     * a promise to the passcode, or undefined to cancel the operation.
     */
    public async loginWithSSO(cb: (passcodeEndpoint: URL) => Promise<string | undefined>) {
        try {
            const passcodeEndpoint = await this.getPasscodeEndpoint();
            const passcode = await cb(passcodeEndpoint);
            if (!passcode) {
                return false;
            }
            await this.loginCommon({
                grant_type: 'urn:ibm:params:oauth:grant-type:passcode',
                passcode
            });
            return true;
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Log out from IBM Cloud.
     */
    public async logout() {
        try {
            this.accessToken = undefined;
            this.expiration = 0;
            await this.store.deleteAccount();
            await this.store.deleteEmail();
            await this.store.deleteRefreshToken();
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Determine whether we are logged into IBM Cloud or not.
     * @returns boolean True if logged into IBM Cloud, false if logged out.
     */
    public async loggedIn() {
        const refreshToken = await this.store.getRefreshToken();
        return !!refreshToken;
    }

    /**
     *
     * @param cb A callback that handles selecting from a list of IBM Cloud accounts.
     * The callback is passed a list of IBM Cloud accounts. The callback must return
     * a promise to an IBM Cloud account from the list, or undefined to cancel the
     * operation.
     */
    public async selectAccount(cb: (accounts: { guid: string, name: string, email: string }[]) => Promise<{ guid: string, name: string, email: string } | undefined>) {
        try {
            const accessToken = await this.getAccessToken(false);
            let url = new URL('/coe/v2/accounts', ACCOUNT_MANAGEMENT_URL);
            const resources = [];
            while (url) {
                const response = await rp.get(url.toString(), {
                    auth: {
                        bearer: accessToken
                    },
                    json: true
                });
                for (const resource of response.resources) {
                    resources.push(resource);
                }
                if (response.next_url) {
                    url = new URL(response.next_url);
                } else {
                    break;
                }
            }
            const accounts = resources.map((resource) => {
                return {
                    guid: resource.metadata.guid,
                    name: resource.entity.name,
                    email: resource.entity.owner_userid
                };
            });
            let selectedAccount;
            if (accounts.length === 1) {
                selectedAccount = accounts[0];
            } else {
                selectedAccount = await cb(accounts);
                if (!selectedAccount) {
                    return false;
                }
            }
            await this.store.setAccount(selectedAccount.guid);
            await this.store.setEmail(selectedAccount.email);
            await this.refreshTokens();
            return true;
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Determine whether we have selected an IBM Cloud account or not.
     * @returns boolean True if an IBM Cloud account has been selected, false if not.
     */
    public async accountSelected() {
        const account = await this.store.getAccount();
        return !!account;
    }

    /**
     * Get an access token suitable for use with IBM Cloud APIs.
     * @param accountRequired True to ensure that the user has selected an IBM Cloud account.
     * @returns string The access token.
     */
    public async getAccessToken(accountRequired: boolean = true) {
        try {
            const loggedIn = await this.loggedIn();
            if (!loggedIn) {
                throw new Error('You are not logged into IBM Cloud');
            }
            const accountSelected = await this.accountSelected();
            if (accountRequired && !accountSelected) {
                throw new Error('You have not selected an IBM Cloud account to use');
            }
            await this.checkTokens();
            return this.accessToken!;
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Get a refresh token suitable for use with IBM Cloud APIs.
     * @param accountRequired True to ensure that the user has selected an IBM Cloud account.
     * @returns string The refresh token.
     */
    public async getRefreshToken(accountRequired: boolean = true) {
        try {
            const loggedIn = await this.loggedIn();
            if (!loggedIn) {
                throw new Error('You are not logged into IBM Cloud');
            }
            const accountSelected = await this.accountSelected();
            if (accountRequired && !accountSelected) {
                throw new Error('You have not selected an IBM Cloud account to use');
            }
            await this.checkTokens();
            return this.store.getRefreshToken();
        } finally {
            this.emit('changed');
        }
    }

    /**
     * Get the current IBM Cloud account.
     * @returns string The current IBM Cloud account, or undefined.
     */
    public async getAccount() {
        return this.store.getAccount();
    }

    /**
     * Get the current IBM Cloud email.
     * @returns string The current IBM Cloud email, or undefined.
     */
    public async getEmail() {
        return this.store.getEmail();
    }

    private async getOpenIDConfiguration() {
        const url = new URL('/identity/.well-known/openid-configuration', IAM_URL);
        return await rp.get(url.toString(), { json: true });
    }

    private async getTokenEndpoint() {
        const openIDConfiguration = await this.getOpenIDConfiguration();
        return new URL(openIDConfiguration.token_endpoint);
    }

    private async getPasscodeEndpoint() {
        const openIDConfiguration = await this.getOpenIDConfiguration();
        return new URL(openIDConfiguration.passcode_endpoint);
    }

    private async loginCommon(form: object, refresh: boolean = false) {
        const tokenEndpoint = await this.getTokenEndpoint();
        const response = await rp.post(tokenEndpoint.toString(), {
            auth: {
                user: 'bx',
                pass: 'bx',
                sendImmediately: true
            },
            form,
            json: true,
            resolveWithFullResponse: true,
            simple: false
        });
        if (!/^2/.test('' + response.statusCode)) {
            if (response.body.errorCode) {
                throw new Error(`${response.body.errorCode}: ${response.body.errorDetails || response.body.errorMessage}`);
            } else {
                throw new Error(`IBM Cloud IAM token endpoint returned HTTP ${response.statusCode}`);
            }
        }
        this.accessToken = response.body.access_token;
        this.expiration = response.body.expiration;
        const refreshToken = response.body.refresh_token;
        if (!refresh) {
            await this.store.deleteAccount();
            await this.store.deleteEmail();
        }
        await this.store.setRefreshToken(refreshToken);
    }

    private async checkTokens() {
        const now = Math.round((new Date()).getTime() / 1000);
        const delta = this.expiration - now;
        if (delta < 60) {
            await this.refreshTokens();
        }
    }

    private async refreshTokens() {
        try {
            const refreshToken = await this.store.getRefreshToken();
            if (!refreshToken) {
                throw new Error();
            }
            const account = await this.store.getAccount();
            await this.loginCommon({
                account,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }, true);
        } catch {
            await this.logout();
            throw new Error('You are not logged into IBM Cloud');
        }
    }

}