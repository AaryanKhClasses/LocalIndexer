import { invoke } from '@tauri-apps/api/core'
import type { Folder } from '../types'
import './index.css'

document.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement
    if(target.tagName !== 'IMG') return
    if(target.classList.contains('remove-folder')) {
        const id = target.getAttribute('data-id')
        if(id && confirm('Remove this folder?')) {
            await invoke('remove_folder', { id: Number(id) })
            loadFolders()
        }
    } else {
        const actionId = target.getAttribute('data-action')
        const path = target.getAttribute('data-path')
        if(!actionId || !path) return
        await invoke('run_action', { actionId, path })
    }
})

async function loadFolders() {
    const folders = await invoke<Folder[]>('get_folders')
    const list = document.getElementById('results')!

    let html = folders.map(folder => {
        return `
        <div class="flex flex-row bg-theme-100 rounded-xl border border-theme-600 items-center justify-between p-2">
            <div class="flex flex-row">
                <img src="folder_type/${folder.folder_type || 'unknown'}.svg" alt="${folder.folder_type || 'unknown'} folder" width="48" class="mr-4" />
                <div class="flex flex-col">
                    <h1 class="text-xl font-bold">${folder.name}</h1>
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
