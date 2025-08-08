
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { allPermissions as allPermissionsList } from '@/app/dashboard/_data/seed-data'

type PermissionName = keyof typeof allPermissionsList;

// Permission check - only Admins can manage permissions
function hasPermission(req: NextRequest) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin';
}

// PUT /api/internal/permissions/roles - Update all role permissions
export async function PUT(req: NextRequest) {
    if (!hasPermission(req)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const permissionsMatrix = body.permissions;

        if (!permissionsMatrix) {
            return NextResponse.json({ message: 'Permissions data is missing.' }, { status: 400 });
        }

        const batch = db.batch();

        // Iterate through each role in the received matrix
        for (const role in permissionsMatrix) {
            if (Object.prototype.hasOwnProperty.call(permissionsMatrix, role)) {
                // We cannot allow changing the Admin role's permissions
                if (role === 'Admin') continue;

                const rolePermissions = permissionsMatrix[role];
                const permissionsToStore: PermissionName[] = [];
                
                // Collect all permissions that are set to true
                for(const perm in rolePermissions) {
                    if (Object.prototype.hasOwnProperty.call(rolePermissions, perm) && rolePermissions[perm] === true) {
                        const permissionName = perm as PermissionName;
                        if (allPermissionsList[permissionName]) {
                            permissionsToStore.push(permissionName);
                        }
                    }
                }
                
                // Set the document in the 'role_permissions' collection
                const roleRef = db.collection('role_permissions').doc(role);
                batch.set(roleRef, { permissions: permissionsToStore });
            }
        }

        await batch.commit();

        return NextResponse.json({ message: 'Role permissions updated successfully.' });

    } catch (error) {
        console.error("Error updating role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// GET /api/internal/permissions/roles - Fetch all role permissions
export async function GET(req: NextRequest) {
    if (!hasPermission(req)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const snapshot = await db.collection('role_permissions').get();
        const permissions: Record<string, Record<string, boolean>> = {};

        snapshot.forEach(doc => {
            const role = doc.id;
            const perms: string[] = doc.data().permissions || [];
            permissions[role] = {};
            perms.forEach(perm => {
                permissions[role][perm] = true;
            });
        });

        return NextResponse.json({ permissions });
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
