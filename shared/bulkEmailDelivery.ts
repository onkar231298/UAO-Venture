/** A successful API response means submission, not necessarily delivery. */
export function bulkEmailDeliveryNotice(status?: string | null) {
  switch (status) {
    case "sent":
      return {
        title: "Mailchimp confirmed sending",
        description: "Mailchimp reports this campaign as sent. This does not confirm inbox delivery.",
      };
    case "scheduled":
      return {
        title: "Mailchimp confirmed scheduling",
        description: "Mailchimp has scheduled this campaign; emails have not been sent yet.",
      };
    case "sending":
      return {
        title: "Mailchimp is processing",
        description: "Sending is still in progress. Check the Mailchimp status before resending.",
      };
    default:
      return {
        title: "Sending is not confirmed",
        description: "Mailchimp has not confirmed completed sending. Check the campaign status; do not resend it yet.",
      };
  }
}