# IBM Cloud Account Extension for VS Code

The IBM Cloud account extension for Visual Studio Code provides a single IBM Cloud sign-in experience for all other IBM extensions.

If you build or use multiple IBM Cloud extensions in VS Code — such as tools for IBM Cloud CLI, Catalog, or Code Engine — each one needs access to your IBM Cloud credentials. Without a shared authentication layer, every extension would ask you to log in separately and manage its own tokens. This extension solves that: log in once and all IBM Cloud extensions share the same session.

The IBM Cloud authentication code in this extension was developed by following the code in the [IBM Cloud CLI SDK](https://github.com/IBM-Cloud/ibm-cloud-cli-sdk).

This extension uses the [keytar](https://www.npmjs.com/package/keytar) module to securely store your IBM Cloud account tokens in the system's keychain. The system keychain is different depending on your current operating system:

- Keychain on macOS
- Secret Service API/libsecret on Linux
- Credential Vault on Windows

## Getting started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=IBM.ibmcloud-account).
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and type **IBM Cloud: Log in** or **IBM Cloud: Create a new account**.
3. Choose your preferred login method: username and password, API key, or SSO.
4. Once logged in, all other IBM Cloud extensions in your workspace will share the same session automatically.

## Commands

| Command | Description |
| --- | --- |
| Create an account | If you do not have an IBM Cloud account, you can use this command to open your web browser and access the IBM Cloud account registration web page. |
| Log in | Log in to an IBM Cloud account. You can use a username and password, API key, or single sign-on (SSO) to log in. |
| Log out | Log out of the IBM Cloud. This command removes all stored information and tokens for your IBM Cloud account. |
| Select account | If your IBM ID has access to multiple IBM Cloud accounts, then use this command to select the IBM Cloud account that you wish to use. |

## Secure credential storage

This extension uses the [keytar](https://www.npmjs.com/package/keytar) module to securely store your IBM Cloud account tokens in the system's keychain. No credentials are written to disk in plaintext. The keychain used depends on your operating system:

- **macOS** — Keychain
- **Linux** — Secret Service API / libsecret
- **Windows** — Credential Vault

## API

Other extensions can make use of the IBM Cloud sign-in experience provided by this extension.

First, declare an `extensionDependency` on this extension in your `package.json`:

```json
"extensionDependencies": [
    "IBM.ibmcloud-account"
]
```

Next, access this extension's API from within your extension:

```typescript
import { CloudAccountApi } from './cloud-account-api';

const cloudAccount = vscode.extensions.getExtension<CloudAccountApi>('IBM.ibmcloud-account')!.exports;
```

The `CloudAccountApi` type is defined in [cloud-account-api.d.ts](./src/cloud-account-api.d.ts). Copy this file into your extension and reference it from there.

You can then use the `CloudAccountApi` object to interact with IBM Cloud services:

```typescript
// Check if the user is logged in.
const loggedIn: boolean = await cloudAccount.loggedIn();

// Check if an IBM Cloud account has been selected.
const selected: boolean = await cloudAccount.accountSelected();

// Get an access token for use in requests to IBM Cloud APIs.
// Pass true to require an account to be selected first.
const accessToken: string = await cloudAccount.getAccessToken();

// Get a refresh token.
const refreshToken: string = await cloudAccount.getRefreshToken();

// Get the current account ID.
const account: string | undefined = await cloudAccount.getAccount();

// Get the email address of the logged-in user.
const email: string | undefined = await cloudAccount.getEmail();
```

## Contributing

Found a bug or want to request a feature? [Open an issue](https://github.com/IBM/vscode-ibmcloud-account/issues) on GitHub.

Pull requests are welcome. The IBM Cloud authentication code in this extension was developed by following the code in the [IBM Cloud CLI SDK](https://github.com/IBM-Cloud/ibm-cloud-cli-sdk).


## License

Apache-2.0
