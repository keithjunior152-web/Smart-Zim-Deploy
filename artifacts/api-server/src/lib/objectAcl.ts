import { supabaseAdmin } from "./objectStorage";

const ACL_POLICY_METADATA_KEY = "x-amz-meta-acl-policy";

export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

export async function setObjectAclPolicy(
  objectRef: { bucket: string; path: string },
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(objectRef.bucket)
    .update(objectRef.path, new Uint8Array(0), {
      metadata: {
        [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
      },
    });
  if (error) {
    throw new Error(`Failed to set ACL policy: ${error.message}`);
  }
}

export async function getObjectAclPolicy(
  objectRef: { bucket: string; path: string },
): Promise<ObjectAclPolicy | null> {
  const { data, error } = await supabaseAdmin
    .from("_storage_objects_metadata")
    .select("metadata")
    .eq("bucket_id", objectRef.bucket)
    .eq("name", objectRef.path)
    .maybeSingle();

  if (error || !data) return null;

  const raw = (data.metadata as Record<string, string> | null)?.[ACL_POLICY_METADATA_KEY];
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ObjectAclPolicy;
  } catch {
    return null;
  }
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: { bucket: string; path: string };
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) return false;

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) return false;

  if (aclPolicy.owner === userId) return true;

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
