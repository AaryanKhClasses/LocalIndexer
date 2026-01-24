import { invoke } from '@tauri-apps/api/core'
import type { AppConfig } from '../types'

let apps: AppConfig[] = []
let appMap = new Map<string, AppConfig>()

export async function loadApps() {
    apps = await invoke<AppConfig[]>('get_app_config')
    appMap = new Map(apps.map(app => [app.id, app]))
}

export function getApps() {
    return apps
}

export function getApp(id: string) {
    return appMap.get(id)
}
