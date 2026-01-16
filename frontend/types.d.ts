export type Folder ={
    id: number
    path: string
    name: string
    folder_type: string
    last_modified: number
}

export type IndexSource = {
    id: number
    path: string
    recursive: boolean
}
