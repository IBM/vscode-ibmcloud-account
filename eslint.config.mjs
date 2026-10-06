// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        files: ['src/**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: {
            'no-throw-literal': 'warn',
            'no-unused-expressions': 'warn',
            'no-redeclare': 'warn',
            'curly': 'warn',
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'class',
                    format: ['PascalCase'],
                },
            ],
            'semi': ['warn', 'always'],
            'eqeqeq': 'warn',
            // Downgrade recommended errors to warnings — pre-existing issues
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-require-imports': 'warn',
        },
    }
);
