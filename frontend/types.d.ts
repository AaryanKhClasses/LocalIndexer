export type Folder = {
    id: number
    name: string
    folder_type: string
    path: string,
    folder_type_locked: boolean
}

export type FolderTypeConfig = {
    id: string
    label: string
    icon: string
}
