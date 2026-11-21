// Audit action names for CAT-05. `AuditLog.action` is a free-text column, so
// this typed union keeps spelling consistent without a Prisma enum migration.
export const MEDIA_AUDIT_ACTIONS = {
  MEDIA_PRESIGN_GENERATED: 'MEDIA_PRESIGN_GENERATED',
  MEDIA_UPLOADED: 'MEDIA_UPLOADED',
  MEDIA_UPLOAD_REJECTED: 'MEDIA_UPLOAD_REJECTED',
  MEDIA_DELETED: 'MEDIA_DELETED',
  MEDIA_REORDERED: 'MEDIA_REORDERED',
} as const;

export type MediaAuditAction = (typeof MEDIA_AUDIT_ACTIONS)[keyof typeof MEDIA_AUDIT_ACTIONS];
