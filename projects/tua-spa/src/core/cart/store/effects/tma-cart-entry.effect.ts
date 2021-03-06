/*
 * SPDX-FileCopyrightText: 2020 SAP SE or an SAP affiliate company <deborah.cholmeley-jones@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { CartActions, CartEntryEffects, SiteContextActions } from '@spartacus/core';
import { from, Observable } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import * as TmaCartEntryActions from '../actions/tma-cart-entry.actions';
import { TmaCartEntryActionTypes } from '../actions/tma-cart-entry.actions';
import { TmaCartEntryConnector } from '../../connectors/tma-cart-entry.connector';
import { withdrawOn } from '../../../config/utils/tma-withdraw-on';
import { makeErrorSerializable } from '../../../config/utils/tma-serialization-utils';

@Injectable()
export class TmaCartEntryEffects extends CartEntryEffects {

  constructor(
    private tmaActions$: Actions,
    private tmaCartEntryConnector: TmaCartEntryConnector
  ) {
    super(tmaActions$, tmaCartEntryConnector);
  }

  private tmaContextChange$ = this.tmaActions$.pipe(
    ofType(
      SiteContextActions.CURRENCY_CHANGE,
      SiteContextActions.LANGUAGE_CHANGE
    )
  );

  @Effect()
  addCartEntry$: Observable<
    | TmaCartEntryActions.AddCartEntrySuccess
    | TmaCartEntryActions.AddCartEntryFail
    | CartActions.LoadCart> = this.tmaActions$.pipe(
      ofType(TmaCartEntryActionTypes.ADD_CART_ENTRY),
      map((action: TmaCartEntryActions.AddCartEntry) => action.payload),
      concatMap(payload =>
        this.tmaCartEntryConnector
          .addCartEntry(payload.userId, payload.cartId, payload.cartEntry)
          .pipe(
            map(() => {
              return new TmaCartEntryActions.AddCartEntrySuccess({
                userId: payload.userId,
                cartId: payload.cartId,
                cartEntry: payload.cartEntry,
              });
            }),
            catchError(error =>
              from([
                new TmaCartEntryActions.AddCartEntryFail(makeErrorSerializable(error)),
                new CartActions.LoadCart({
                  cartId: payload.cartId,
                  userId: payload.userId,
                }),
              ])
            )
          )
      ),
      withdrawOn(this.tmaContextChange$)
    );

  @Effect()
  updateCartEntry$: Observable<| TmaCartEntryActions.UpdateCartEntrySuccess
    | TmaCartEntryActions.UpdateCartEntryFail
    | CartActions.LoadCart> = this.tmaActions$.pipe(
      ofType(TmaCartEntryActionTypes.UPDATE_CART_ENTRY),
      map((action: TmaCartEntryActions.UpdateCartEntry) => action.payload),
      concatMap(payload =>
        this.tmaCartEntryConnector
          .updateCartEntry(payload.userId, payload.cartId, payload.cartEntry)
          .pipe(
            map(() => {
              return new TmaCartEntryActions.UpdateCartEntrySuccess({
                userId: payload.userId,
                cartId: payload.cartId,
                cartEntry: payload.cartEntry,
              });
            }),
            catchError(error =>
              from([
                new TmaCartEntryActions.UpdateCartEntryFail(makeErrorSerializable(error)),
                new CartActions.LoadCart({
                  cartId: payload.cartId,
                  userId: payload.userId,
                }),
              ])
            )
          )
      ),
      withdrawOn(this.tmaContextChange$)
    );
}
