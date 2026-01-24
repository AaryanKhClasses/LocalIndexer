export type Folder = {
    id: number
    name: string
    folder_type: string
    path: string,
    folder_type_locked: boolean
    apps: string[]
}

export type FolderTypeConfig = {
    id: string
    label: string
    icon: string
}

export type AppConfig = {
    id: string
    name: string
    icon: string
    default: boolean
}
