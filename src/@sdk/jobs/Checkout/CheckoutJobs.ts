import { DataErrorCheckoutTypes, ICreditCard } from "@sdk/api/Checkout/types";
import { ApolloClientManager } from "@temp/@sdk/data/ApolloClientManager";
import {
  ICheckoutAddress,
  LocalStorageHandler,
} from "@temp/@sdk/helpers/LocalStorageHandler";

import { PromiseCheckoutJobRunResponse } from "../types";

export class CheckoutJobs {
  private apolloClientManager: ApolloClientManager;
  private localStorageHandler: LocalStorageHandler;

  constructor(
    localStorageHandler: LocalStorageHandler,
    apolloClientManager: ApolloClientManager
  ) {
    this.apolloClientManager = apolloClientManager;
    this.localStorageHandler = localStorageHandler;
  }

  createCheckout = async ({
    email,
    lines,
    shippingAddress,
    selectedShippingAddressId,
    billingAddress,
    selectedBillingAddressId,
  }: {
    email: string;
    lines: Array<{ variantId: string; quantity: number }>;
    shippingAddress?: ICheckoutAddress;
    selectedShippingAddressId?: string;
    billingAddress?: ICheckoutAddress;
    selectedBillingAddressId?: string;
  }): PromiseCheckoutJobRunResponse => {
    const { data, error } = await this.apolloClientManager.createCheckout(
      email,
      lines,
      shippingAddress,
      billingAddress
    );

    if (error) {
      /**
       * TODO: Differentiate errors!!! THIS IS A BUG!!!
       * DataErrorCheckoutTypes.SET_SHIPPING_ADDRESS is just one of every possible - instead of deprecated errors, checkoutErrors should be used.
       */
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.SET_SHIPPING_ADDRESS,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...data,
        selectedBillingAddressId,
        selectedShippingAddressId,
      });
      return {
        data,
      };
    }
  };

  setShippingAddress = async ({
    checkoutId,
    shippingAddress,
    email,
    selectedShippingAddressId,
  }: {
    checkoutId: string;
    shippingAddress: ICheckoutAddress;
    email: string;
    selectedShippingAddressId?: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const { data, error } = await this.apolloClientManager.setShippingAddress(
      shippingAddress,
      email,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.SET_SHIPPING_ADDRESS,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        billingAsShipping: false,
        email: data?.email,
        selectedShippingAddressId,
        shippingAddress: data?.shippingAddress,
      });
      return { data };
    }
  };

  setBillingAddress = async ({
    checkoutId,
    billingAddress,
    billingAsShipping,
    selectedBillingAddressId,
  }: {
    checkoutId: string;
    billingAddress: ICheckoutAddress;
    billingAsShipping?: boolean;
    selectedBillingAddressId?: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const { data, error } = await this.apolloClientManager.setBillingAddress(
      billingAddress,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.SET_BILLING_ADDRESS,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        billingAddress: data?.billingAddress,
        billingAsShipping: !!billingAsShipping,
        selectedBillingAddressId,
      });
      return { data };
    }
  };

  setBillingAddressWithEmail = async ({
    checkoutId,
    email,
    billingAddress,
    selectedBillingAddressId,
  }: {
    checkoutId: string;
    email: string;
    billingAddress: ICheckoutAddress;
    selectedBillingAddressId?: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const {
      data,
      error,
    } = await this.apolloClientManager.setBillingAddressWithEmail(
      billingAddress,
      email,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.SET_BILLING_ADDRESS,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        billingAddress: data?.billingAddress,
        billingAsShipping: false,
        email: data?.email,
        selectedBillingAddressId,
      });
      return { data };
    }
  };

  setShippingMethod = async ({
    checkoutId,
    shippingMethodId,
  }: {
    checkoutId: string;
    shippingMethodId: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const { data, error } = await this.apolloClientManager.setShippingMethod(
      shippingMethodId,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.SET_SHIPPING_METHOD,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        promoCodeDiscount: data?.promoCodeDiscount,
        shippingMethod: data?.shippingMethod,
      });
      return { data };
    }
  };

  addPromoCode = async ({
    checkoutId,
    promoCode,
  }: {
    checkoutId: string;
    promoCode: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const { data, error } = await this.apolloClientManager.addPromoCode(
      promoCode,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.ADD_PROMO_CODE,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        promoCodeDiscount: data?.promoCodeDiscount,
      });
      return { data };
    }
  };

  removePromoCode = async ({
    checkoutId,
    promoCode,
  }: {
    checkoutId: string;
    promoCode: string;
  }): PromiseCheckoutJobRunResponse => {
    const checkout = this.localStorageHandler.getCheckout();

    const { data, error } = await this.apolloClientManager.removePromoCode(
      promoCode,
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.REMOVE_PROMO_CODE,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({
        ...checkout,
        promoCodeDiscount: data?.promoCodeDiscount,
      });
      return { data };
    }
  };

  createPayment = async ({
    checkoutId,
    amount,
    paymentGateway,
    paymentToken,
    billingAddress,
    creditCard,
  }: {
    checkoutId: string;
    amount: number;
    paymentGateway: string;
    paymentToken: string;
    billingAddress: ICheckoutAddress;
    creditCard?: ICreditCard;
  }): PromiseCheckoutJobRunResponse => {
    const payment = this.localStorageHandler.getPayment();

    const { data, error } = await this.apolloClientManager.createPayment(
      amount,
      checkoutId,
      paymentGateway,
      paymentToken,
      billingAddress
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.CREATE_PAYMENT,
        },
      };
    } else {
      this.localStorageHandler.setPayment({
        ...payment,
        creditCard,
        gateway: data?.gateway,
        id: data?.id,
        token: data?.token,
      });
      return { data };
    }
  };

  completeCheckout = async ({
    checkoutId,
  }: {
    checkoutId: string;
  }): PromiseCheckoutJobRunResponse => {
    const { data, error } = await this.apolloClientManager.completeCheckout(
      checkoutId
    );

    if (error) {
      return {
        dataError: {
          error,
          type: DataErrorCheckoutTypes.COMPLETE_CHECKOUT,
        },
      };
    } else {
      this.localStorageHandler.setCheckout({});
      this.localStorageHandler.setPayment({});
      return { data };
    }
  };
}
