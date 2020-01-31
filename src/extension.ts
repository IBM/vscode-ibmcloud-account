/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { CloudAccount } from './cloud-account';
import { CloudAccountStore } from './cloud-account-store';
import { URL } from 'url';
import { CloudAccountApi } from './cloud-account-api';

let cloudAccount: CloudAccount;
let cloudAccountStore: CloudAccountStore;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {

    // Create classes for IBM Cloud authentication.
    cloudAccountStore = new CloudAccountStore(context.globalState);
    cloudAccount = new CloudAccount(cloudAccountStore);

    // Create the status bar item, update, and show it.
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    await updateStatusBarItem();
    statusBarItem.show();

    // Register for changed events so we can update the status bar item.
    cloudAccount.on('changed', () => {
        updateStatusBarItem().catch((error) => {

        });
    });

    // Register all commands.
    context.subscriptions.push(vscode.commands.registerCommand('ibmcloud-account.createAccount', createAccount));
    context.subscriptions.push(vscode.commands.registerCommand('ibmcloud-account.login', login));
    context.subscriptions.push(vscode.commands.registerCommand('ibmcloud-account.logout', logout));
    context.subscriptions.push(vscode.commands.registerCommand('ibmcloud-account.selectAccount', selectAccount));

    // Return the API so other extensions can access it.
    const api: CloudAccountApi = {
        loggedIn: async () => {
            return cloudAccount.loggedIn();
        },
        accountSelected: async () => {
            return cloudAccount.accountSelected();
        },
        getAccessToken: async (accountRequired?: boolean) => {
            return cloudAccount.getAccessToken(accountRequired);
        },
        getRefreshToken: async (accountRequired?: boolean) => {
            return cloudAccount.getRefreshToken(accountRequired);
        },
        getAccount: async () => {
            return cloudAccount.getAccount();
        },
        getEmail: async () => {
            return cloudAccount.getEmail();
        }
    };
    return api;

}

export async function deactivate() {

}

async function createAccount() {
    await vscode.env.openExternal(vscode.Uri.parse('https://cloud.ibm.com/registration'));
}

async function login() {

    // Build the quick pick items.
    const items = [
        {
            label: 'Log in with a username and password',
            function: 'loginWithUsernameAndPassword'
        },
        {
            label: 'Log in with an API key',
            function: 'loginWithApiKey'
        },
        {
            label: 'Log in with a federated ID using single sign-on (SSO)',
            description: 'Opens a web browser for authentication',
            function: 'loginWithSSO'
        }
    ];

    // Ask the user how they want to log in to IBM Cloud.
    const item = await vscode.window.showQuickPick(items, {
        ignoreFocusOut: true,
        placeHolder: 'How do you want to log in to IBM Cloud?'
    });
    if (!item) {
        // User cancelled.
        return;
    }

    // Handle the users choice.
    switch (item.function) {
        case 'loginWithUsernameAndPassword':
            return loginWithUsernameAndPassword();
        case 'loginWithApiKey':
            return loginWithApiKey();
        case 'loginWithSSO':
            return loginWithSSO();
    }

}

async function loginWithUsernameAndPassword() {

    // Get the username.
    const username = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Enter your username',
    });
    if (!username) {
        // User cancelled.
        return;
    }

    // Get the password.
    const password = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: 'Enter your password',
    });
    if (!password) {
        // User cancelled.
        return;
    }

    // Log in and select an account.
    try {
        await cloudAccount.loginWithUsernameAndPassword(username, password);
        await vscode.commands.executeCommand('ibmcloud-account.selectAccount');
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

}

async function loginWithApiKey() {

    // Get the API key.
    const apiKey = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: 'Enter your API key',
    });
    if (!apiKey) {
        // User cancelled.
        return;
    }

    // Log in and select an account.
    try {
        await cloudAccount.loginWithApiKey(apiKey);
        await vscode.commands.executeCommand('ibmcloud-account.selectAccount');
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

}

async function loginWithSSO() {

    // Callback for below log in method.
    async function cb(passcodeEndpoint: URL) {

        // Open the passcode endpoint in a web browser.
        await vscode.env.openExternal(vscode.Uri.parse(passcodeEndpoint.toString()));

        // Get the passcode.
        return await vscode.window.showInputBox({
            ignoreFocusOut: true,
            password: true,
            placeHolder: 'Enter your one time passcode from the web browser',
        });

    }

    // Log in and select an account.
    try {
        await cloudAccount.loginWithSSO(cb);
        await vscode.commands.executeCommand('ibmcloud-account.selectAccount');
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

}

async function logout() {

    // Log out.
    try {
        await cloudAccount.logout();
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

}

async function selectAccount() {

    // Callback for below log in method.
    async function cb(accounts: { guid: string, name: string, email: string }[]) {

        // Map accounts to quick pick items.
        const items = accounts.map((account, index) => {
            return {
                description: account.guid,
                label: account.email,
                index
            };
        });

        // Get the account.
        const item = await vscode.window.showQuickPick(items, {
            ignoreFocusOut: true,
            placeHolder: 'Select an IBM Cloud account'
        });
        if (!item) {
            return;
        }

        // Return the selected account.
        return accounts[item.index];

    }

    // Select an account.
    try {
        const loggedIn = await cloudAccount.loggedIn();
        if (!loggedIn) {
            await login();
        } else {
            await cloudAccount.selectAccount(cb);
        }
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

}

async function updateStatusBarItem() {
    const loggedIn = await cloudAccount.loggedIn();
    const email = await cloudAccount.getEmail();
    let text = 'IBM Cloud: ';
    if (loggedIn) {
        if (email) {
            text += email;
        } else {
            text += 'logged in';
        }
    } else {
        text += 'logged out';
    }
    statusBarItem.text = text;
}