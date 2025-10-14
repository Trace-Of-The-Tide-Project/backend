import { Log } from '../../logs/models/log.model';
import { AuditTrail } from '../../audit-trails/models/audit-trail.model';

export class ActivityLogger {
    static async logAction(userId: string, action: string, entityType: string, entityId: string, details: any = {}) {
        await Log.create({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details: JSON.stringify(details),
        } as any)
    }

    static async recordAudit(userId: string, action: string, entityType: string, entityId: string, changes: any) {
        await AuditTrail.create({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            changes: JSON.stringify(changes),
        } as any);
    }
}
