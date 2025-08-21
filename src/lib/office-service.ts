import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Office {
    id: string
    name: string
    latitude: number
    longitude: number
    isActive?: boolean
}

export async function getOffices(): Promise<Office[]> {
    const q = query(collection(db, 'offices'), orderBy('name'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Office[]
}

export async function getOfficeById(officeId: string): Promise<Office | null> {
    const ref = doc(db, 'offices', officeId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return { id: snap.id, ...(snap.data() as any) } as Office
}

export async function getOfficeMap(officeIds: string[]): Promise<Record<string, Office>> {
    const unique = Array.from(new Set(officeIds)).filter(Boolean)
    const map: Record<string, Office> = {}
    await Promise.all(unique.map(async (id) => {
        try {
            const ref = doc(db, 'offices', id)
            const snap = await getDoc(ref)
            if (snap.exists()) {
                map[id] = { id: snap.id, ...(snap.data() as any) } as Office
            }
        } catch {}
    }))
    return map
}


