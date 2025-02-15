import { TPaymentLinkRequest } from "../entities/Payment";
type chargeJ5TransactionParams = {
    transactionId: string;
    masof: string;
    masofPassword: string;
    originalAmount: number;
    actualAmount: number;
    orderId: string;
    creditCardConfirmNumber: string;
    transactionUID: string;
    clientName: string;
    clientLastName: string;
};
export declare const hypPaymentService: {
    readonly chargeJ5Transaction: (params: chargeJ5TransactionParams) => Promise<{
        success: boolean;
        errMessage?: undefined;
    } | {
        success: boolean;
        errMessage: any;
    }>;
    readonly createPaymentLink: (params: TPaymentLinkRequest) => Promise<{
        success: boolean;
        paymentLink: string;
        errMessage?: undefined;
    } | {
        success: boolean;
        errMessage: any;
        paymentLink?: undefined;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map