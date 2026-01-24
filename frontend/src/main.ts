import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import type { Folder } from '../types'
import './index.css'
import { getApp, getApps, loadApps } from './apps'
import { getFolderType, getFolderTypes, loadFolderTypes } from './folderTypes'

let activeFilter: string | null = null
let currentFolders: Folder[] = []

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

    if(target.closest('#folder-apps-picker')) {
        if(target.classList.contains('save-apps')) {
            const folderId = Number(target.getAttribute('data-folder-id'))
            if(!folderId) return

            const picker = document.getElementById('folder-apps-picker')!
            const checkboxes = picker.querySelectorAll<HTMLInputElement>('input[data-app-id]')
            const apps = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.getAttribute('data-app-id')!).filter(Boolean)

            await invoke('update_folder_apps', { id: folderId, apps })
            closeAppPicker()
            return loadFolders()
        }

        if(target.classList.contains('close-app-picker')) closeAppPicker()
        return
    }

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
        const pickerWidth = picker.offsetWidth
        
        const spaceBelow = window.innerHeight - rect.bottom
        if(spaceBelow < pickerHeight + 5) picker.style.top = `${rect.top - pickerHeight - 5}px`
        else picker.style.top = `${rect.bottom + 5}px`

        let left = rect.left
        if(rect.left + pickerWidth > window.innerWidth - 5) {
            left = Math.max(5, rect.right - pickerWidth)
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
    }
    else if(target.classList.contains('open-settings')) {
        const id = Number(target.getAttribute('data-id'))
        const folder = currentFolders.find(f => f.id === id)
        if(!folder) return
        renderAppPicker(folder, target)
        return e.stopPropagation()
    }
    else if(target.classList.contains('app-action')) {
        const actionId = target.getAttribute('data-action')
        const path = target.getAttribute('data-path')
        if(!actionId || !path) return
        await invoke('run_action', { actionId, path })
    }

    if(!target.closest('#folder-type-picker')) closeFolderTypePicker()
    if(!target.closest('#folder-apps-picker')) closeAppPicker()
})

async function loadFolders() {
    const folders = await invoke<Folder[]>('get_folders')
    const list = document.getElementById('results')!

    currentFolders = folders

    let html = folders.map(folder => {
        const type = getFolderType(folder.folder_type) ?? getFolderType('unknown')
        const icon = type?.icon || 'unknown.svg'
        const label = type?.label || 'unknown'
        const actions = renderAppActions(folder)
        return `
        <div class="flex flex-row bg-theme-100 rounded-xl border border-theme-600 items-center justify-between p-2">
            <div class="flex flex-row">
                <img src="folder_type/${icon}" alt="${label} folder" width="48" class="mr-4 cursor-pointer folder-type-icon" data-id="${folder.id}" data-current="${folder.folder_type}" />
                <div class="flex flex-col">
                    <h1 class="text-xl font-bold">${folder.name} ${folder.folder_type_locked ? `<span class="mr-2 lock-icon cursor-pointer" data-id="${folder.id}" title="Unlock folder type">🔒</span>` : ''}</h1>
                    <h2 class="text-md font-normal line-clamp-1">${folder.path}</h2>
                </div>
            </div>
            <div class="flex flex-row gap-2 items-center">
                ${actions}
                <img src="remove.svg" alt="Remove Folder" width="32" class="remove-folder cursor-pointer" data-id="${folder.id}" />
                <img src="settings.svg" alt="Open Settings" width="32" class="open-settings cursor-pointer" data-id="${folder.id}" />
            </div>
        </div>
        `
    }).join('')

    list.innerHTML = html
    if(activeFilter) applyFilter(activeFilter)
}

function renderAppActions(folder: Folder) {
    const available = getApps()
    const defaultApps = available.filter(app => app.default)
    const selectedIds = (folder.apps && folder.apps.length) ? folder.apps : defaultApps.map(app => app.id)
    const selectedApps = selectedIds
        .map(id => getApp(id))
        .filter((app): app is NonNullable<ReturnType<typeof getApp>> => Boolean(app))

    if(!selectedApps.length) return '<span class="text-sm text-theme-600">No apps</span>'

    return selectedApps.map(app => {
        const iconPath = app.icon.includes('/') ? app.icon : `apps/${app.icon}`
        return `<img src="${iconPath}" alt="${app.name}" width="28" data-action="${app.id}" data-path="${folder.path}" class="cursor-pointer app-action rounded" title="Open in ${app.name}" />`
    }).join('')
}

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
            const pickerWidth = picker.offsetWidth
            
            const spaceBelow = window.innerHeight - rect.bottom
            if(spaceBelow < pickerHeight + 5) picker.style.top = `${rect.top - pickerHeight - 5}px`
            else picker.style.top = `${rect.bottom + 5}px`

            let left = rect.left
            if(rect.left + pickerWidth > window.innerWidth - 5) {
                left = Math.max(5, rect.right - pickerWidth)
            }
            picker.style.left = `${left}px`
            e.stopPropagation()
        })
    }
}

function renderFolderTypePicker(folderId: number | 'filter', currentType: string) {
    const picker = document.getElementById('folder-type-picker')!
    const types = getFolderTypes()

    picker.innerHTML = `
        <div class="grid grid-cols-4 gap-2">
            ${types.map(type => `
                <img src="folder_type/${type.icon}" title="${type.label}" data-id="${folderId === 'filter' ? 'filter' : folderId}" data-type="${type.id}" width="48" class="folder-type-option cursor-pointer rounded-lg ${type.id === currentType ? 'ring-2 ring-blue-500' : 'hover:bg-theme-200'}" />
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
    if(filterImg) {
        const ft = activeFilter ? getFolderType(activeFilter) : null
        filterImg.src = `folder_type/${ft?.icon ?? 'unknown.svg'}`
    }
}

function closeFolderTypePicker() {
    const picker = document.getElementById('folder-type-picker')!
    picker.classList.add('hidden')
    picker.innerHTML = ''
}

function renderAppPicker(folder: Folder, anchor: HTMLElement) {
    const picker = document.getElementById('folder-apps-picker')!
    const apps = getApps()
    const defaultApps = apps.filter(a => a.default)
    const selected = new Set((folder.apps && folder.apps.length ? folder.apps : defaultApps.map(a => a.id)))

    picker.innerHTML = `
        <div class="bg-theme-100 border border-theme-600 rounded-xl p-3 shadow-xl w-72">
            <div class="flex items-center justify-between mb-2">
                <div class="font-semibold text-lg">Apps for ${folder.name}</div>
                <button class="close-app-picker cursor-pointer text-sm px-2 rounded hover:bg-theme-200">✕</button>
            </div>
            <div class="flex flex-col gap-2 max-h-64 overflow-auto pr-1">
                ${apps.map(app => {
                    const iconPath = app.icon.includes('/') ? app.icon : `apps/${app.icon}`
                    const checked = selected.has(app.id) ? 'checked' : ''
                    return `<label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" data-app-id="${app.id}" ${checked} />
                        <img src="${iconPath}" alt="${app.name}" width="20" />
                        <span>${app.name}</span>
                    </label>`
                }).join('')}
            </div>
            <div class="flex justify-end mt-3 gap-2">
                <button class="save-apps w-full bg-theme-600 text-white px-3 py-1 rounded-md" data-folder-id="${folder.id}">Save</button>
            </div>
        </div>
    `

    picker.classList.remove('hidden')

    const rect = anchor.getBoundingClientRect()
    const pickerHeight = picker.offsetHeight
    const pickerWidth = picker.offsetWidth
    
    const spaceBelow = window.innerHeight - rect.bottom
    if(spaceBelow < pickerHeight + 5) picker.style.top = `${rect.top - pickerHeight - 5}px`
    else picker.style.top = `${rect.bottom + 5}px`

    let left = rect.left
    if(rect.left + pickerWidth > window.innerWidth - 5) {
        left = Math.max(5, rect.right - pickerWidth)
    }
    picker.style.left = `${left}px`
}

function closeAppPicker() {
    const picker = document.getElementById('folder-apps-picker')!
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

document.getElementById('refresh')!.onclick = loadFolders
async function main() {
    await Promise.all([loadFolderTypes(), loadApps()])
    await loadFolders()
}
main()
