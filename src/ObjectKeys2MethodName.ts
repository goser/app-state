type Internal<T extends Record<string, unknown>, Key = keyof T> = Key extends string
    ? T[Key] extends Record<string, unknown>
    ? `${Capitalize<Key>}${Capitalize<Internal<T[Key]>>}`
    : `${Capitalize<Key>}`
    : never

export type ObjectKeys2MethodName<T extends Record<string, unknown>, Key = keyof T> = Uncapitalize<Internal<T, Key>>