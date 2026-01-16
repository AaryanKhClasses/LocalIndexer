import { invoke } from '@tauri-apps/api/core'
import type { Folder, IndexSource } from '../types'

document.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement
    if(target.tagName !== 'BUTTON') return

    const action = target.getAttribute('data-action')
    const path = target.getAttribute('data-path')
    if(!action || !path) return
    await invoke('run_action', { actionId: action, path, isFolder: true })
})

async function loadSources() {
    const sources = await invoke<IndexSource[]>('get_index_sources')
    const list = document.getElementById('sources')!

    list.innerHTML = sources.map(source => `
        <div style="padding: 8px; border-bottom: 1px solid #ddd">
            <strong>${source.path}</strong><br/>
            <em>Recursive: ${source.recursive}</em>
        </div>
    `).join('')
}

document.getElementById('add-source')!.onclick = async() => {
    const path = (document.getElementById('source-path') as HTMLInputElement).value
    const recursive = (document.getElementById('recursive') as HTMLInputElement).checked
    await invoke('add_index_source', { path, recursive })
    await loadSources()
}
loadSources()

async function loadFolders() {
    const folders = await invoke<Folder[]>('get_folders')
    const list = document.getElementById('results')!

    list.innerHTML = folders.map(folder => `
        <div style="padding: 8px; border-bottom: 1px solid #ddd">
            <strong>${folder.name}</strong><br/>
            <em>${folder.path}</em><br/>
            <button data-action="open_vscode" data-path="${folder.path}">Open in VSCode</button>
            <button data-action="open_in_explorer" data-path="${folder.path}">Open in Explorer</button>
        </div>
    `).join('')
}

document.getElementById('refresh')!.onclick = loadFolders
loadFolders()
