import { URL } from "url";

/*
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The external interface exposed by the IBM Cloud Account extension
 * for use by other modules to interact with IBM Cloud APIs.
 */
export interface CloudAccountApi {

    /**
     * Determine whether we are logged into IBM Cloud or not.
     * @returns boolean True if logged into IBM Cloud, false if logged out.
     */
    loggedIn(): Promise<boolean>;

    /**
     * Determine whether we have selected an IBM Cloud account or not.
     * @returns boolean True if an IBM Cloud account has been selected, false if not.
     */
    accountSelected(): Promise<boolean>;

    /**
     * Get an access token suitable for use with IBM Cloud APIs.
     * @param accountRequired True to ensure that the user has selected an IBM Cloud account.
     * @returns string The access token.
     */
    getAccessToken(accountRequired?: boolean): Promise<string>;

    /**
     * Get a refresh token suitable for use with IBM Cloud APIs.
     * @param accountRequired True to ensure that the user has selected an IBM Cloud account.
     * @returns string The refresh token.
     */
    getRefreshToken(accountRequired?: boolean): Promise<string>;

    /**
     * Get the current IBM Cloud account.
     * @returns string The current IBM Cloud account, or undefined.
     */
    getAccount(): Promise<string | undefined>;

    /**
     * Get the current IBM Cloud email.
     * @returns string The current IBM Cloud email, or undefined.
     */
    getEmail(): Promise<string | undefined>;

}