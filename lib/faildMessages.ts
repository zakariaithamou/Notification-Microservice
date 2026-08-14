//translates Resend's technical bounce codes
// into human-friendly messages and action suggestions
export interface BounceInfo {
  message: string;
  actions: string[];
}

export const BOUNCE_INFO: Record<string, BounceInfo> = {
  Permanent_General: {
    message:
      "The recipient's email provider permanently rejected this message and it will not be delivered. This often happens when the address is invalid, deactivated, or the domain no longer exists.",
    actions: [
      // ← these ARE the suggested actions
      "Verify the recipient's email address for typos.",
      "Check that the recipient's domain is valid and operational.",
      "Remove this address from future sends to protect your sender reputation.",
    ],
  },
  MailboxDoesNotExist: {
    message:
      "Recipient not found: The email couldn't be delivered because the recipient address doesn't exist. This often indicates a typo, a deactivated account, or an invalid domain.",
    actions: [
      "Verify recipient email: double-check the address for typos.",
      "Check domain: ensure the recipient's domain is valid and operational.",
      "Contact recipient through an alternative channel if the address looks correct.",
    ],
  },
  Suppressed: {
    message:
      "This address is suppressed due to a previous hard bounce and is not being sent to, in order to protect your sender reputation.",
    actions: [
      "Confirm the address is correct before removing it from suppression.",
      "Avoid re-sending to this address without verifying it first.",
    ],
  },
  MailboxFull: {
    message:
      "The recipient's mailbox is full and cannot accept new messages right now.",
    actions: [
      "Wait and retry later — the recipient's inbox may free up space.",
      "Contact the recipient through another channel if this persists.",
    ],
  },
  ContentRejected: {
    message:
      "The recipient's mail server rejected the message content, possibly due to spam filtering.",
    actions: [
      "Review the email content for spammy language or broken formatting.",
      "Contact the recipient to confirm they haven't blocked your domain.",
    ],
  },
};

export const DEFAULT_BOUNCE_INFO: BounceInfo = {
  message: "Delivery failed for an unspecified reason.",
  actions: [
    "Contact the recipient through an alternative channel to confirm their email address.",
  ],
};

export function getBounceInfo(type?: string, subType?: string): BounceInfo {
  if (!type || !subType) return DEFAULT_BOUNCE_INFO;
  const key = `${type}_${subType}`;
  return BOUNCE_INFO[key] ?? DEFAULT_BOUNCE_INFO;
}
