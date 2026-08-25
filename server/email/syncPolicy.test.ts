import assert from "node:assert/strict";
import test from "node:test";
import {
  canSendSalesOrder,
  emailThreadIncludesRecipient,
  isSalesOrderEmailThreadCompatible,
  normalizeReplySubject,
  requestedReplyThreadId,
  renderCampaignRecipientSubject,
  stableInboundMessageId,
  titanInboundProviderId,
  uniquelyMatchedCampaignCompanyId,
  uniquelyMatchingLeadBySender,
} from "./syncPolicy";

test("the same RFC Message-ID is deduplicated per mailbox, not globally", () => {
  const rawMessageId = "<shared-message@example.com>";

  assert.equal(titanInboundProviderId(11, rawMessageId), titanInboundProviderId(11, rawMessageId));
  assert.notEqual(titanInboundProviderId(11, rawMessageId), titanInboundProviderId(12, rawMessageId));
});

test("messages without an RFC Message-ID keep a stable identity after UIDVALIDITY changes", () => {
  const rawMessage = Buffer.from("From: customer@example.com\r\nSubject: Hello\r\n\r\nSame message");
  const firstPass = stableInboundMessageId(rawMessage);
  const replayAfterUidValidityChange = stableInboundMessageId(rawMessage);

  assert.equal(firstPass, replayAfterUidValidityChange);
  assert.equal(titanInboundProviderId(11, firstPass), titanInboundProviderId(11, replayAfterUidValidityChange));
});

test("campaign subject matching uses the recipient's rendered subject", () => {
  const rendered = renderCampaignRecipientSubject(
    "Hello {{ contact_name }} from {{company_name}} ({{ email }})",
    { contactName: "Asha", companyName: "Acme", email: "asha@example.com" },
  );

  assert.equal(rendered, "Hello Asha from Acme (asha@example.com)");
  assert.equal(normalizeReplySubject(`Re: ${rendered}`), normalizeReplySubject(rendered));
});

test("ambiguous campaign and lead matches stay unassigned", () => {
  assert.equal(
    uniquelyMatchedCampaignCompanyId([{ companyId: 1 }, { companyId: 2 }]),
    undefined,
  );
  assert.equal(
    uniquelyMatchingLeadBySender(
      [
        { id: 1, contactPerson: { email: "buyer@example.com" } },
        { id: 2, contactPerson: { email: "buyer@example.com" } },
      ],
      "buyer@example.com",
    ),
    undefined,
  );
});

test("a unique sender contact can be linked while another representative is denied sales-order access", () => {
  const matchedLead = uniquelyMatchingLeadBySender(
    [
      { id: 1, contactPerson: { email: "buyer@example.com" } },
      { id: 2, contactPerson: { email: "other@example.com" } },
    ],
    "BUYER@example.com",
  );
  assert.equal(matchedLead?.id, 1);

  assert.equal(
    canSendSalesOrder("rep-b", "sales_executive", {
      assignedToUserId: "rep-a",
      lead: { assignedSalesRep: "rep-a" },
      company: { assignedTo: "rep-a" },
    }),
    false,
  );
  assert.equal(
    canSendSalesOrder("manager", "sales_manager", { assignedToUserId: "rep-a" }),
    true,
  );
});

test("sales-order email threads must belong to the order's lead or company", () => {
  const order = { leadId: 11, companyId: 22 };

  assert.equal(
    isSalesOrderEmailThreadCompatible(order, { leadId: 11, companyId: null }),
    true,
  );
  assert.equal(
    isSalesOrderEmailThreadCompatible(order, { leadId: null, companyId: 22 }),
    true,
  );
  assert.equal(
    isSalesOrderEmailThreadCompatible(order, { leadId: 99, companyId: 22 }),
    true,
  );
  assert.equal(
    isSalesOrderEmailThreadCompatible(order, { leadId: 99, companyId: 88 }),
    false,
  );
  assert.equal(
    isSalesOrderEmailThreadCompatible(
      { leadId: null, companyId: null },
      { leadId: null, companyId: null },
    ),
    false,
  );
});

test("company email thread IDs are only used for explicit valid replies", () => {
  assert.equal(requestedReplyThreadId(42, true), 42);
  assert.equal(requestedReplyThreadId("42", true), 42);
  assert.equal(requestedReplyThreadId(42, false), undefined);
  assert.equal(requestedReplyThreadId(42, undefined), undefined);
  assert.equal(requestedReplyThreadId(undefined, true), undefined);
  assert.equal(requestedReplyThreadId("invalid", true), undefined);
  assert.equal(requestedReplyThreadId(0, true), undefined);
});

test("AI replies can only target a recipient already present in the selected thread", () => {
  const thread = { participantEmails: ["sales@bright-fame.com", "buyer-a@example.com"] };
  const messages = [{
    fromEmail: "buyer-a@example.com",
    toEmails: ["sales@bright-fame.com"],
    ccEmails: [],
    bccEmails: [],
  }];

  assert.equal(emailThreadIncludesRecipient(thread, messages, "BUYER-A@example.com"), true);
  assert.equal(emailThreadIncludesRecipient(thread, messages, "buyer-b@example.com"), false);
  assert.equal(emailThreadIncludesRecipient({ participantEmails: [] }, messages, "buyer-a@example.com"), true);
});
