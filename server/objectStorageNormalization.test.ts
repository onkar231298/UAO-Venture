import assert from "node:assert/strict";
import test from "node:test";
import { ObjectStorageService } from "./objectStorage";

test("private upload paths normalize without configuring public storage", () => {
  const previousPrivate = process.env.PRIVATE_OBJECT_DIR;
  const previousPublic = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
  try {
    process.env.PRIVATE_OBJECT_DIR = "/test-bucket/private";
    delete process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    const service = new ObjectStorageService();
    assert.equal(
      service.normalizeObjectEntityPath(
        "https://storage.googleapis.com/test-bucket/private/uploads/example",
      ),
      "/objects/uploads/example",
    );
    assert.throws(() => service.getPublicObjectSearchPaths(), /not set/);
  } finally {
    if (previousPrivate === undefined) delete process.env.PRIVATE_OBJECT_DIR;
    else process.env.PRIVATE_OBJECT_DIR = previousPrivate;
    if (previousPublic === undefined) delete process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    else process.env.PUBLIC_OBJECT_SEARCH_PATHS = previousPublic;
  }
});
