export type TransferEvidenceStatus =
  | "DELIVERY_VERIFIED_BY_FINALIZED_CHILD"
  | "DUPLICATE_DELIVERY_OBSERVED"
  | "CHILD_FAILED_DELIVERY_UNPROVEN"
  | "UNKNOWN";

export function classifyOutgoingTransfer(input: {
  parentStatus?: string;
  parentExecution?: string;
  parentRecipient?: string;
  expectedVault: string;
  expectedRecipient: string;
  expectedAmount: bigint | string | number;
  children: Array<{
    from_address?: string;
    sender?: string;
    to_address?: string;
    recipient?: string;
    value?: bigint | string | number;
    statusName?: string;
    txExecutionResultName?: string;
    hash?: string;
    txId?: string;
  }>;
}): { status: TransferEvidenceStatus; matchingChildren: string[] };
