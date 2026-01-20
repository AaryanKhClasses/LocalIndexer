import { invoke } from '@tauri-apps/api/core'
import type { FolderTypeConfig } from '../types'

let folderTypes: FolderTypeConfig[] = []
let folderTypeMap = new Map<string, FolderTypeConfig>()

export async function loadFolderTypes() {
    folderTypes = await invoke<FolderTypeConfig[]>('get_folder_type_config')
    folderTypeMap = new Map(folderTypes.map(t => [t.id, t]))
}

export function getFolderTypes() {
    return folderTypes
}

export function getFolderType(id: string) {
    return folderTypeMap.get(id)
}
