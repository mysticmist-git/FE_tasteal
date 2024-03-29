import { CartEntity } from '../models/entities/CartEntity/CartEntity';
import { getApiUrl } from '../constants/api';
import { AccountEntity } from '../models/entities/AccountEntity/AccountEntity';
import { PersonalCartItemEntity } from '../models/entities/PersonalCartItemEntity/PersonalCartItemEntity';
import { PersonalCartItemReq } from '../models/dtos/Request/PersonalCartItemReq/PersonalCartItemReq';
import { PersonalCartItemUpdateReq } from '../models/dtos/Request/PersonalCartItemUpdateReq/PersonalCartItemUpdateReq';

class CartService {
  public static async GetCartByAccountId(
    accountId: AccountEntity['uid']
  ): Promise<CartEntity[]> {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };

    return await fetch(
      `${getApiUrl('GetAllCartByAccountId')}?accountId=${accountId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        return data;
      })
      .catch((error) => {
        console.error('Lỗi:', error);
        throw error;
      });
  }

  public static async DeleteCartByAccountId(
    accountId: AccountEntity['uid']
  ): Promise<boolean> {
    const requestOptions: RequestInit = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };

    return await fetch(
      `${getApiUrl('DeleteAllCartByAccountId')}?accountId=${accountId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        throw error;
      });
  }

  public static async UpdateCart(
    CartId: CartEntity['id'],
    servingSize: CartEntity['serving_size']
  ): Promise<boolean> {
    const requestOptions: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };

    return await fetch(
      `${getApiUrl('UpdateCart')}?CartId=${CartId}&servingSize=${servingSize}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        throw error;
      });
  }

  public static async DeleteCartById(
    cartId: CartEntity['id']
  ): Promise<boolean> {
    const requestOptions: RequestInit = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };

    return await fetch(
      `${getApiUrl('DeleteCartById')}?cartId=${cartId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        return false;
      });
  }

  public static async GetPersonalCartsByUserId(
    accountId: AccountEntity['uid']
  ): Promise<PersonalCartItemEntity[]> {
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    };

    return await fetch(
      `${getApiUrl('GetPersonalCartsByUserId')}?userId=${accountId}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        return [];
      });
  }

  public static async AddPersonalCart(
    personalCartItem: PersonalCartItemReq
  ): Promise<PersonalCartItemEntity> {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(personalCartItem as PersonalCartItemReq),
    };

    return await fetch(`${getApiUrl('AddPersonalCart')}`, requestOptions)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        throw error;
      });
  }

  public static async UpdatePersonalCart(
    personalCartItem: PersonalCartItemUpdateReq
  ): Promise<boolean> {
    const requestOptions: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(personalCartItem as PersonalCartItemUpdateReq),
    };

    return await fetch(`${getApiUrl('UpdatePersonalCart')}`, requestOptions)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error('Lỗi:', error);
        throw error;
      });
  }
}

export default CartService;
