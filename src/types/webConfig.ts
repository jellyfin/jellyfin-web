interface Theme {
    name: string
    id: string
    color: string
}

interface MenuLink {
    name: string
    icon?: string
    url: string
}

export interface WebConfig {
    includeCorsCredentials?: boolean
    multiserver?: boolean
    themes?: Theme[]
    menuLinks?: MenuLink[]
    servers?: string[]
    plugins?: string[]
}
