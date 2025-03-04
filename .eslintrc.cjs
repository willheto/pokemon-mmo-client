'use strict';

const path = require('path');

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	env: {
		browser: true,
		jest: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	rules: {
		'@typescript-eslint/explicit-function-return-type': 'warn',
		'@typescript-eslint/no-unused-vars': 'warn',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-var-requires': 'error',
		'@typescript-eslint/no-empty-function': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'prefer-const': 'warn',
		'no-misleading-character-class': 'error',
	},
	settings: {
		linkComponents: ['Hyperlink', { name: 'Link', linkAttribute: 'to' }],
		defaultSeverity: 'error',
	},
	parserOptions: {
		project: path.resolve(__dirname, 'tsconfig.json'),
		tsconfigRootDir: __dirname,
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	ignorePatterns: [
		'.eslintrc.js',
		'node_modules/',
		'globals.ts',
		'embed.ts',
		'vite.constants.ts',
		'jest.config.js',
		'src/api/index.ts',
		'**/*test*',
	],
};
