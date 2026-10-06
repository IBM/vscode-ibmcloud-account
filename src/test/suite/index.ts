/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import Mocha from 'mocha';
import glob from 'glob';

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
	});

	const testsRoot = path.resolve(__dirname, '..');
	const files = glob.sync('**/**.test.js', { cwd: testsRoot });

	// Add files to the test suite
	files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

	return new Promise((c, e) => {
		mocha.run(failures => {
			if (failures > 0) {
				e(new Error(`${failures} tests failed.`));
			} else {
				c();
			}
		});
	});
}
