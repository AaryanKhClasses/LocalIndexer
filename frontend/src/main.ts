import { invoke } from '@tauri-apps/api/core'
import type { Folder } from '../types'
import './index.css'

const FOLDER_TYPES = [
    'chrome', 'cpp', 'flutter', 'kotlin', 'minecraft', 'next', 'python', 'react-native', 'typescript', 'unknown'
]

document.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement

    if(target.classList.contains('folder-type-option')) {
        const id = Number(target.getAttribute('data-id'))
        const type = target.getAttribute('data-type')
        if(!id || !type) return

        await invoke('override_folder_type', { id, folderType: type })
        closeFolderTypePicker()
        return loadFolders()
    }
    else if(target.classList.contains('folder-type-icon')) {
        const id = Number(target.getAttribute('data-id'))
        const current = target.getAttribute('data-current') || 'unknown'
        const picker = document.getElementById('folder-type-picker')!

        const rect = target.getBoundingClientRect()
        picker.style.top = `${rect.bottom + window.scrollY + 5}px`
        picker.style.left = `${rect.left + window.scrollX}px`
        renderFolderTypePicker(id, current)
        return e.stopPropagation()
    } 
    else if(target.classList.contains('lock-icon')) {
        const id = target.getAttribute('data-id')
        if(!id) return
        await invoke('unlock_folder_type', { id: Number(id) })
        loadFolders()
    }
    else if(target.classList.contains('remove-folder')) {
        const id = target.getAttribute('data-id')
        if(!id) return
        await invoke('remove_folder', { id: Number(id) })
        loadFolders()
    } else {
        const actionId = target.getAttribute('data-action')
        const path = target.getAttribute('data-path')
        if(!actionId || !path) return closeFolderTypePicker()
        await invoke('run_action', { actionId, path })
    }

    closeFolderTypePicker()
})

async function loadFolders() {
    const folders = await invoke<Folder[]>('get_folders')
    const list = document.getElementById('results')!

    let html = folders.map(folder => {
        return `
        <div class="flex flex-row bg-theme-100 rounded-xl border border-theme-600 items-center justify-between p-2">
            <div class="flex flex-row">
                <img src="folder_type/${folder.folder_type || 'unknown'}.svg" alt="${folder.folder_type || 'unknown'} folder" width="48" class="mr-4 cursor-pointer folder-type-icon" data-id="${folder.id}" data-current="${folder.folder_type || 'unknown'}" />
                <div class="flex flex-col">
                    <h1 class="text-xl font-bold">${folder.name} ${folder.folder_type_locked ? `<span class="mr-2 lock-icon cursor-pointer" data-id="${folder.id}" title="Unlock folder type">🔒</span>` : ''}</h1>
                    <h2 class="text-md font-normal line-clamp-1">${folder.path}</h2>
                </div>
            </div>
            <div class="flex flex-row gap-2 items-center">
                <img src="vscode.svg" alt="VSCode Logo" width="32" data-action="open_vscode" data-path="${folder.path}" class="cursor-pointer" />
                <img src="explorer.svg" alt="Explorer Logo" width="32" data-action="open_explorer" data-path="${folder.path}" class="cursor-pointer" />
                <img src="remove.svg" alt="Remove Folder" width="32" class="remove-folder cursor-pointer" data-id="${folder.id}" />
            </div>
        </div>
        `
    }).join('')

    list.innerHTML = html
}

document.getElementById('add-source')!.onclick = async () => {
    const pathInput = document.getElementById('source-path') as HTMLInputElement
    const path = pathInput.value.trim()
    if(!path) return
    const name = path.replace(/\\|\//g, '/').split('/').filter(Boolean).pop() || path
    const folder_type = 'source'
    try {
        await invoke('add_folder', { name, folder_type, path })
        pathInput.value = ''
        loadFolders()
    } catch(e: any) {
        alert('Failed to add folder: ' + (e?.toString() || 'Unknown error'))
    }
}

document.getElementById('refresh')!.onclick = loadFolders
loadFolders()

function renderFolderTypePicker(folderId: number, currentType: string) {
    const picker = document.getElementById('folder-type-picker')!

    picker.innerHTML = `
        <div class="grid grid-cols-4 gap-2">
            ${FOLDER_TYPES.map(type => `
                <img src="folder_type/${type}.svg" title="${type}" data-id="${folderId}" data-type="${type}" width="48" class="folder-type-option cursor-pointer rounded-lg ${type === currentType ? 'ring-2 ring-blue-500' : 'hover:bg-theme-200'}" />
            `).join('')}
        </div>
    `
    picker.classList.remove('hidden')
}

function closeFolderTypePicker() {
    const picker = document.getElementById('folder-type-picker')!
    picker.classList.add('hidden')
    picker.innerHTML = ''
}
