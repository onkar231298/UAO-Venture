import test from "node:test";
import assert from "node:assert/strict";
import { canManageInquiry } from "./inquiryAccess";

test("assigned sales staff can manage only their own inquiries", () => {
  assert.equal(canManageInquiry("rep-1", "sales_executive", { assignedTo: "rep-1" }), true);
  assert.equal(canManageInquiry("rep-1", "sales_manager", { assignedTo: "rep-2" }), false);
  assert.equal(canManageInquiry("rep-1", "sales_executive", { assignedTo: null }), false);
  assert.equal(canManageInquiry("rep-1", "customer", { assignedTo: "rep-1" }), false);
  assert.equal(canManageInquiry("rep-1", undefined, { assignedTo: "rep-1" }), false);
});

test("admins can manage inquiries regardless of assignment", () => {
  assert.equal(canManageInquiry("admin-1", "admin", { assignedTo: "rep-1" }), true);
  assert.equal(canManageInquiry("admin-1", "super_admin", { assignedTo: null }), true);
  assert.equal(canManageInquiry("admin-1", "admin", undefined), true);
});
