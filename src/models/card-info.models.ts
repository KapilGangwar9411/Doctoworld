export class CardInfo {
    name!: string;
    number!: string;
    expMonth!: number;
    expYear!: number;
    cvc!: string;

    areFieldsFilled() {
        return ((this.name && this.name.length)
            &&
            (String(this.number) && String(this.number).length)
            &&
            (this.expMonth && this.expMonth <= 12 && this.expMonth >= 1)
            &&
            (this.expYear && this.expYear <= 99)
            &&
            (String(this.cvc) && String(this.cvc).length));
    }

    static getSavedCard(): CardInfo {
        let cardInfo = new CardInfo();
        let savedCardInfo = JSON.parse(window.localStorage.getItem("card_info_saved")!);
        if (savedCardInfo) {
            cardInfo.name = savedCardInfo.name;
            cardInfo.number = savedCardInfo.number;
            cardInfo.expMonth = savedCardInfo.expMonth;
            cardInfo.expYear = savedCardInfo.expYear;
        }
        return cardInfo;
    }

    static setSavedCard(cardInfo: CardInfo) {
        window.localStorage.setItem("card_info_saved", JSON.stringify(cardInfo));
    }
}
