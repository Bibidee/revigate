export type TransferEvidenceStatus =
  | "CHILD_FINALIZED_SUCCESS"
  | "DUPLICATE_SUCCESSFUL_CHILDREN"
  | "CHILD_FINALIZED_FAILURE"
  | "CHILD_PENDING"
  | "CHILD_UNDETERMINED"
  | "CHILD_CANCELLED"
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
    requestedHash?: string;
  }>;
}): { status: TransferEvidenceStatus; matchingChildren: string[] };

export function classifyRecipientBalanceDelta(input: {
  before: bigint | string | number;
  after: bigint | string | number;
  expectedAmount: bigint | string | number;
}): { status: "BALANCE_DELTA_MATCHED" | "BALANCE_DELTA_MISMATCHED"; observedDelta: string }
  | { status: "BALANCE_DELTA_UNKNOWN" };
