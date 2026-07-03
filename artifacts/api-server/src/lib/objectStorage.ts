import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET ?? "smartzim-public";
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET ?? "smartzim-private";

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use file storage. " +
        "Add them to your environment variables (see .env.example).",
    );
  }
  _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return _supabaseAdmin;
}

export { getSupabase as supabaseAdmin };

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
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(PUBLIC_BUCKET).download(filePath);
    if (error || !data) return null;
    return { bucket: PUBLIC_BUCKET, path: filePath };
  }

  async downloadObject(
    ref: { bucket: string; path: string },
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(ref.bucket).download(ref.path);
    if (error || !data) throw new ObjectNotFoundError();

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
    const supabase = getSupabase();
    const objectId = randomUUID();
    const uploadPath = `uploads/${objectId}`;
    const { error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(uploadPath, buffer, { contentType, upsert: false });
    if (error) throw new Error(`Failed to upload file: ${error.message}`);
    return `/objects/uploads/${objectId}`;
  }

  async getObjectEntityUploadURL(): Promise<{ uploadUrl: string; objectPath: string }> {
    const supabase = getSupabase();
    const objectId = randomUUID();
    const uploadPath = `uploads/${objectId}`;
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUploadUrl(uploadPath);
    if (error || !data) throw new Error(`Failed to create signed upload URL: ${error?.message}`);
    return { uploadUrl: data.signedUrl, objectPath: `/objects/${uploadPath}` };
  }

  async getObjectEntityFile(objectPath: string): Promise<{ bucket: string; path: string }> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const storagePath = objectPath.slice("/objects/".length);
    if (!storagePath) throw new ObjectNotFoundError();
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).download(storagePath);
    if (error || !data) throw new ObjectNotFoundError();
    return { bucket: PRIVATE_BUCKET, path: storagePath };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const prefix = `${supabaseUrl}/storage/v1/object/public/`;
    if (!rawPath.startsWith(prefix)) return rawPath;
    const afterPrefix = rawPath.slice(prefix.length);
    const bucketEnd = afterPrefix.indexOf("/");
    if (bucketEnd === -1) return rawPath;
    return `/objects/${afterPrefix.slice(bucketEnd + 1)}`;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
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
    const supabase = getSupabase();
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async createSignedUrl(
    storagePath: string,
    bucket: string = PRIVATE_BUCKET,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data) throw new Error(`Failed to create signed URL: ${error?.message}`);
    return data.signedUrl;
  }
}
