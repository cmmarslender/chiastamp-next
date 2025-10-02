export enum Position {
    Left = "left",
    Right = "right",
}

export interface ProofStep {
    hash: string; // Hex string
    position: Position; // Left or Right
}

export interface ProofResponse {
    confirmed: boolean;
    header_hash?: string;
    coin_id?: string;
    root_hash: string;
    leaf_hash: string;
    proof: ProofStep[];
    salt?: string; // Salt used for hashing (hex string). Optional, for compat with early test versions that did not salt.
}
