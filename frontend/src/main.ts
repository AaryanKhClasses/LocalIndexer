import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import type { Folder } from '../types'
import './index.css'

const FOLDER_TYPES = [
    'chrome', 'cpp', 'flutter', 'kotlin', 'minecraft', 'next', 'python', 'react-native', 'typescript', 'unknown'
]

let activeFilter: string | null = null

const THEME_KEY = 'theme'

function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
    const toggle = document.getElementById('theme-toggle') as HTMLImageElement | null
    if(toggle) toggle.src = theme === 'dark' ? 'moon.svg' : 'sun.svg'
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

function initTheme() {
    let saved: string | null = null
    try { saved = localStorage.getItem(THEME_KEY) } catch {}
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = (saved === 'dark' || saved === 'light') ? saved : (systemDark ? 'dark' : 'light')
    setTheme(theme as 'light' | 'dark')
}

window.addEventListener('load', () => {
    initTheme()
    const toggle = document.getElementById('theme-toggle')
    if(toggle) toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme')
        const next = current === 'dark' ? 'light' : 'dark'
        setTheme(next as 'light' | 'dark')
    })
})

document.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement

    if(target.classList.contains('folder-type-option')) {
        const idAttr = target.getAttribute('data-id')
        const type = target.getAttribute('data-type')
        if(!idAttr || !type) return

        if(idAttr === 'filter') {
            applyFilter(type)
            closeFolderTypePicker()
            return
        }

        const id = Number(idAttr)
        if(!id || !type) return

        await invoke('override_folder_type', { id, folderType: type })
        closeFolderTypePicker()
        return loadFolders()
    }
    else if(target.classList.contains('folder-type-icon')) {
        const id = Number(target.getAttribute('data-id'))
        const current = target.getAttribute('data-current') || 'unknown'
        const picker = document.getElementById('folder-type-picker')!

        renderFolderTypePicker(id, current)
        const rect = target.getBoundingClientRect()
        const pickerHeight = picker.offsetHeight
        const spaceBelow = window.innerHeight - rect.bottom
        if(spaceBelow < pickerHeight + 5) picker.style.top = `${rect.top + window.scrollY - pickerHeight - 5}px`
        else picker.style.top = `${rect.bottom + window.scrollY + 5}px`

        const pickerWidth = picker.offsetWidth
        let left = rect.left + window.scrollX
        if(rect.left + pickerWidth > window.innerWidth - 5) {
            left = Math.max(5, rect.right + window.scrollX - pickerWidth)
        }
        picker.style.left = `${left}px`
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
    if(activeFilter) applyFilter(activeFilter)
}

document.getElementById('refresh')!.onclick = loadFolders
loadFolders()

const filterContainer = document.getElementById('filter-type')
if(filterContainer) {
    const filterImg = filterContainer.querySelector('img')
    if(filterImg) {
        filterImg.addEventListener('click', (e) => {
            const current = activeFilter || 'unknown'
            renderFolderTypePicker('filter', current)

            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const picker = document.getElementById('folder-type-picker')!
            const pickerHeight = picker.offsetHeight
            const spaceBelow = window.innerHeight - rect.bottom
            if(spaceBelow < pickerHeight + 5) picker.style.top = `${rect.top + window.scrollY - pickerHeight - 5}px`
            else picker.style.top = `${rect.bottom + window.scrollY + 5}px`

            const pickerWidth = picker.offsetWidth
            let left = rect.left + window.scrollX
            if(rect.left + pickerWidth > window.innerWidth - 5) {
                left = Math.max(5, rect.right + window.scrollX - pickerWidth)
            }
            picker.style.left = `${left}px`
            e.stopPropagation()
        })
    }
}

function renderFolderTypePicker(folderId: number | 'filter', currentType: string) {
    const picker = document.getElementById('folder-type-picker')!

    picker.innerHTML = `
        <div class="grid grid-cols-4 gap-2">
            ${FOLDER_TYPES.map(type => `
                <img src="folder_type/${type}.svg" title="${type}" data-id="${folderId === 'filter' ? 'filter' : folderId}" data-type="${type}" width="48" class="folder-type-option cursor-pointer rounded-lg ${type === currentType ? 'ring-2 ring-blue-500' : 'hover:bg-theme-200'}" />
            `).join('')}
        </div>
    `
    picker.classList.remove('hidden')
}

function applyFilter(type: string | null) {
    if(!type || type === 'unknown') activeFilter = null
    else activeFilter = type
    const folders = document.getElementById('results')!.children
    for(let i = 0; i < folders.length; i++) {
        const folder = folders[i] as HTMLElement
        const img = folder.querySelector('.folder-type-icon') as HTMLElement | null
        const ft = img?.getAttribute('data-current') || 'unknown'
        if(!activeFilter || activeFilter === 'all' || ft === activeFilter) folder.classList.remove('hidden')
        else folder.classList.add('hidden')
    }
    const filterImg = document.querySelector('#filter-type img') as HTMLImageElement | null
    if(filterImg) filterImg.src = `folder_type/${activeFilter || 'unknown'}.svg`
}

function closeFolderTypePicker() {
    const picker = document.getElementById('folder-type-picker')!
    picker.classList.add('hidden')
    picker.innerHTML = ''
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


document.getElementById('browse-source')!.onclick = async() => {
    const selected = await open({ directory: true, multiple: false })
    if(typeof selected === 'string') {
        const pathInput = document.getElementById('source-path') as HTMLInputElement
        pathInput.value = selected
    }
}

document.getElementById('search')!.oninput = (e) => {
    const target = e.target as HTMLInputElement
    const query = target.value.toLowerCase()
    const folders = document.getElementById('results')!.children
    for(let i = 0; i < folders.length; i++) {
        const folder = folders[i] as HTMLElement
        const name = folder.innerText.toLowerCase().split('\n')[0]
        if(name.includes(query)) folder.classList.remove('hidden')
        else folder.classList.add('hidden')
    }
}
