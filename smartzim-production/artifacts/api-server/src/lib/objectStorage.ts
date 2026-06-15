import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET ?? "smartzim-public";
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET ?? "smartzim-private";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL must be set. Check your environment variables.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set. Check your environment variables.");
}

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  async searchPublicObject(filePath: string): Promise<{ bucket: string; path: string } | null> {
    const { data, error } = await supabaseAdmin.storage
      .from(PUBLIC_BUCKET)
      .download(filePath);
    if (error || !data) return null;
    return { bucket: PUBLIC_BUCKET, path: filePath };
  }

  async downloadObject(
    ref: { bucket: string; path: string },
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const { data, error } = await supabaseAdmin.storage
      .from(ref.bucket)
      .download(ref.path);

    if (error || !data) {
      throw new ObjectNotFoundError();
    }

    const isPublic = ref.bucket === PUBLIC_BUCKET;
    const contentType = data.type || "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        "Content-Length": String(data.size),
      },
    });
  }

  async uploadObjectEntity(buffer: Buffer, contentType: string): Promise<string> {
    const objectId = randomUUID();
    const uploadPath = `uploads/${objectId}`;

    const { error } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .upload(uploadPath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return `/objects/uploads/${objectId}`;
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const uploadPath = `uploads/${objectId}`;

    const { data, error } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .createSignedUploadUrl(uploadPath);

    if (error || !data) {
      throw new Error(`Failed to create signed upload URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  async getObjectEntityFile(objectPath: string): Promise<{ bucket: string; path: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const entityId = objectPath.slice("/objects/".length);
    if (!entityId) throw new ObjectNotFoundError();

    const storagePath = entityId;

    const { data, error } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .download(storagePath);

    if (error || !data) {
      throw new ObjectNotFoundError();
    }

    return { bucket: PRIVATE_BUCKET, path: storagePath };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    const supabaseStoragePrefix = `${SUPABASE_URL}/storage/v1/object/public/`;
    if (!rawPath.startsWith(supabaseStoragePrefix)) return rawPath;

    const afterPrefix = rawPath.slice(supabaseStoragePrefix.length);
    const bucketEnd = afterPrefix.indexOf("/");
    if (bucketEnd === -1) return rawPath;

    const objectPath = afterPrefix.slice(bucketEnd + 1);
    return `/objects/${objectPath}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) return normalizedPath;

    const objectRef = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectRef, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: { bucket: string; path: string };
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  getPublicUrl(storagePath: string, bucket: string = PUBLIC_BUCKET): string {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async createSignedUrl(
    storagePath: string,
    bucket: string = PRIVATE_BUCKET,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message}`);
    }
    return data.signedUrl;
  }
}
