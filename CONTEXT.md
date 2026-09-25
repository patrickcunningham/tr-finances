# TR Finances

A private dashboard for a two-person household to understand their Trade Republic accounts, built from Trade Republic's own transaction export and processed entirely on the viewer's device.

## Language

### People and accounts

**Account Holder**:
One of the two people in the household who owns a Trade Republic account.
_Avoid_: User, customer, owner

**Account**:
A single Account Holder's Trade Republic account, covering both its cash and its securities. It is identified by its Trade Republic IBAN.
_Avoid_: Portfolio (that is only the securities side), depot

**Household**:
The combined view of both Accounts, where figures are summed across Account Holders and Internal Transfers cancel out.
_Avoid_: Family, joint account (Trade Republic has no joint account)

**Internal Transfer**:
Money moved from one Account Holder's Account to the other's. It is a Deposit or Withdrawal in each Account's own view, but not in the Household view.
_Avoid_: Transfer (on its own this means any movement in or out)

### Source data

**Transaction Export**:
The CSV file an Account Holder downloads from Trade Republic (Profile → Statements → Transaction export) covering a chosen period of one Account.
_Avoid_: Statement, Kontoauszug, upload, CSV

**Transaction**:
One row of a Transaction Export, identified by Trade Republic's transaction id, representing a single booked event on an Account.
_Avoid_: Row, entry, booking

**Transaction Date**:
The date on which Trade Republic considers a Transaction effective. All monthly and tax-year reporting uses it, even when the booking happened days later.
_Avoid_: Booking date, timestamp

**Transaction History**:
All the Transactions known for one Account, built up by merging every Transaction Export imported for it. The same Transaction is never counted twice.
_Avoid_: Import, dataset, upload

**Cash Effect**:
The net change a Transaction makes to the Account's cash: its amount together with any fee and tax.
_Avoid_: Amount (the export's amount excludes fee and tax)

### Kinds of Transaction

**Deposit**:
Money coming into an Account from outside Trade Republic, whether as a standard or an instant transfer.
_Avoid_: Inbound, top-up, Einzahlung

**Withdrawal**:
Money leaving an Account to an outside bank account.
_Avoid_: Outbound, payout

**Trade**:
A buy or sell of a security.
_Avoid_: Order, execution

**Savings Plan Buy**:
A buy carried out automatically by one of the Account Holder's recurring savings plans.
_Avoid_: Sparplan execution, recurring buy

**Payout**:
Cash paid out by a security the Account holds, whether Trade Republic labels it a dividend or a distribution.
_Avoid_: Dividend, distribution (Trade Republic uses both labels for the same thing)

**Interest**:
Interest Trade Republic pays on the Account's uninvested cash.
_Avoid_: Zinsen, Guthabenverzinsung

**Coupon**:
Interest paid by a bond the Account holds.
_Avoid_: Interest (that is only interest on cash), bond interest

**Accrued Interest**:
Interest that has built up on a bond since its last Coupon and changes hands with the bond on top of its price. It is negative capital income for the buyer and capital income for the seller, and it is neither part of the bond's cost nor part of the sale proceeds.
_Avoid_: Stückzinsen, fees

**Tax Event**:
A Transaction that only withholds or refunds tax and moves no other money. Vorabpauschale charges, tax optimisations and tax corrections are all Tax Events.
_Avoid_: Earnings (Trade Republic's misleading label)

**Corporate Action**:
A change to a Position that the issuer causes rather than the Account Holder, such as a stock split.
_Avoid_: Event

### Portfolio

**Position**:
The quantity of one security (identified by ISIN) that an Account currently holds. For a bond, the quantity is its nominal amount.
_Avoid_: Holding, asset, stock

**Invested Capital**:
The FIFO cost of the Positions an Account still holds.
_Avoid_: Total bought, invested amount

**Net Contributions**:
Deposits minus Withdrawals: the money the Account Holder has put into Trade Republic overall, whether it is invested or still held as cash.
_Avoid_: Invested Capital, net deposits

**Realised Gain**:
The profit or loss made when a security is sold, measured against the cost of its earliest-bought units first (FIFO), the method German tax uses.
_Avoid_: Profit, return, P&L

**Market Price**:
The latest known price of one unit of a security in EUR, together with where it came from and when it was fetched. For a bond, one unit is one unit of nominal.
_Avoid_: Current price, quote

**Unrealised Gain**:
A Position's value at the Market Price minus its FIFO cost.
_Avoid_: Paper gain, open P&L

### Tax

**Withheld Tax**:
The tax Trade Republic actually deducted or refunded on a Transaction. It is the authoritative figure. Anything the app calculates itself is only a cross-check.
_Avoid_: Tax (on its own), Kapitalertragsteuer

**Loss Pot**:
Losses carried forward within one Account and tax year. Share losses sit in their own pot and can only offset share gains; all other losses go in a general pot.
_Avoid_: Verlusttopf, loss carryforward

### Trade Republic terms kept in German

**Vorabpauschale**:
An annual German tax charged on accumulating funds as if they had paid out a notional return, even though no cash was received.
_Avoid_: Advance lump sum, prepayment

**Freistellungsauftrag**:
The annual allowance of capital income that is exempt from German tax. The Household shares one jointly assessed allowance and splits it between the two Accounts.
_Avoid_: Tax allowance, Sparerpauschbetrag (the legal amount behind it)
