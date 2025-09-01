module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: ['plugin:vue/essential', 'airbnb-base'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        uni: 'readonly',
        plus: 'readonly',
        createPage: 'readonly',
        getCurrentPages: 'readonly',
        getApp: 'readonly',
        $getAppWebview: 'readonly',
        $: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['vue'],
    rules: {
        indent: ['error', 4],
        'no-underscore-dangle': 'off',
        'no-param-reassign': 'off',
        'max-len': 'off',
        'no-console': 'off',
        'default-case': 'warn',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'no-nested-ternary': 'off',
        'no-continue': 'off',
        'no-multi-spaces': 'off',
        'linebreak-style': ['off', 'windows'],
        'keyword-spacing': [
            'error',
            {
                overrides: {
                    if: {after: false},
                    for: {after: false},
                    while: {after: false},
                },
            },
        ],
        'no-plusplus': 'off',
        'object-curly-spacing': ['error', 'never'],
        'comma-dangle': 'off',
        'prefer-destructuring': 'warn',
        'import/prefer-default-export': 'off',
        'vue/script-indent': ['error', 4],
        'vue/html-indent': ['error', 2, {
            ignores: ['VElement[name=z-code-block].children']
        }],
        'import/no-extraneous-dependencies': ['error', {devDependencies: ['tools/**/*.js']}],
        'import/no-unresolved': ['error', {ignore: ['^@/']}]
    },
};
