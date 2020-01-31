# vscode-ibmcloud-account

The IBM Cloud account extension for Visual Studio Code provides a single IBM Cloud sign-in experience for all other IBM extensions.

The IBM Cloud authentication code in this extension was developed by following the code in the IBM Cloud CLI SDK, available here: https://github.com/IBM-Cloud/ibm-cloud-cli-sdk

This extension uses the [keytar](https://www.npmjs.com/package/keytar) module to securely store your IBM Cloud account tokens in the system's keychain. The system keychain is different depending on your current operating system:
- Keychain on macOS
- Secret Service API/libsecret on Linux
- Credential Vault on Windows

## Commands

| Command | Description |
| --- | --- |
| Create an account | If you do not have an IBM Cloud account, you can use this command to open your web browser and access the IBM Cloud account registration web page. |
| Log in | Log in to an IBM Cloud account. You can use a username and password, API key, or single sign-on (SSO) to log in. |
| Log out | Log out of the IBM Cloud. This command removes all stored information and tokens for your IBM Cloud account. |
| Select account | If your IBM ID has access to multiple IBM Cloud accounts, then use this command to select the IBM Cloud account that you wish to use. |

## API

Other extensions can make use of the IBM Cloud sign-in experience provided by this extension.

First, declare an `extensionDependency` on this extension:

```json
"extensionDependencies": [
    "IBM.ibmcloud-account"
]
```

Next, access this extensions API from within your extension:

```typescript
// Access the IBM Cloud Account extension API.
const cloudAccount: CloudAccountApi = vscode.extensions.getExtension<CloudAccountApi>('IBM.ibmcloud-account')!.exports;
```

The `CloudAccountApi` type is defined in [extension.d.ts](./src/extension.d.ts). You should copy this file into your extension and reference it from there.

Finally, you can use the `CloudAccountApi` object to interact with IBM Cloud services, and access information about the logged in use:

```typescript
// Get an access token for use in requests to the IBM Cloud APIs.
const accessToken: string = await cloudAccount.getAccessToken();

// Get the email of the IBM Cloud account.
const email: string = await cloudAccount.getEmail();

// Find out if the user has logged into the IBM Cloud.
const loggedIn: boolean = await cloudAccount.isLoggedIn();
```

## License

Apache-2.0