export const BsLintJsonAllRules = {
    'rules': {
        'aa-comma-style': 'no-dangling',
        'anon-function-style': 'auto',
        'assign-all-paths': 'error',
        'block-if-style': 'no-then',
        'case-sensitivity': 'warn',
        'color-alpha': 'off',
        'color-alpha-defaults': 'off',
        'color-case': 'off',
        'color-cert': 'off',
        'color-format': 'off',
        'condition-style': 'no-group',
        'consistent-return': 'error',
        'eol-last': 'always',
        'inline-if-style': 'then',
        'named-function-style': 'auto',
        'no-print': 'off',
        'no-stop': 'warn',
        'no-todo': 'off',
        'todo-pattern': 'TODO|todo|FIXME',
        'type-annotations': 'off',
        'unreachable-code': 'info',
        'unsafe-iterators': 'error',
        'unsafe-path-loop': 'error',
        'unused-variable': 'warn'
    },
    'globals': [
        '_brs_'
    ] as string[],
    'ignores': [
        'lib/**/*',
        '**/lib/**/*',
        'specific-script.brs',
        '*.test.brs'
    ] as string[]
} as const;
